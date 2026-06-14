// src/app.tsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Shield,
  AlertTriangle,
  Clock,
  Bell,
  Users,
  Database,
  LayoutDashboard,
  Clock3,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Fingerprint,
  CornerDownRight,
  CheckSquare,
  Square
} from 'lucide-react';
import type { RiskAccount, DashboardMetrics, BonusInsights } from './types';
import { BUILT_IN_MOCK_ACCOUNTS, MOCK_METRICS } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [accounts, setAccounts] = useState<RiskAccount[]>(BUILT_IN_MOCK_ACCOUNTS);
  const [metrics, setMetrics] = useState<DashboardMetrics>(MOCK_METRICS);
  const [bonusInsights, setBonusInsights] = useState<BonusInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // State for tracking the selected row for the AI Detail Drawer
  const [selectedAccount, setSelectedAccount] = useState<RiskAccount | null>(BUILT_IN_MOCK_ACCOUNTS[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [isolatedIdentities, setIsolatedIdentities] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dashboardRef = useRef<HTMLDivElement | null>(null);
  const usersRef = useRef<HTMLDivElement | null>(null);
  const eventsRef = useRef<HTMLDivElement | null>(null);
  const reportsRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<HTMLDivElement | null>(null);

  // Checklist state for demo interactivity
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [metricsResponse, accountsResponse, bonusResponse] = await Promise.all([
          axios.get<DashboardMetrics>(`${API_BASE_URL}/api/metrics`),
          axios.get<RiskAccount[]>(`${API_BASE_URL}/api/risky-accounts`),
          axios.get<BonusInsights>(`${API_BASE_URL}/api/bonus-insights`)
        ]);
        if (metricsResponse.data) setMetrics(metricsResponse.data);
        if (bonusResponse.data) setBonusInsights(bonusResponse.data);
        if (accountsResponse.data && accountsResponse.data.length > 0) {
          setAccounts(accountsResponse.data);
          setSelectedAccount(prev => {
            if (!prev) return accountsResponse.data[0];

            return accountsResponse.data.find(account => account.user_id === prev.user_id) || accountsResponse.data[0];
          });
        }
      } catch (error) {
        console.warn("Operating on local mockData fallback engines.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();

    const intervalId = window.setInterval(fetchDashboardData, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  // Sort logic applied to accounts mapping
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortOrder === 'asc') return a.risk_score - b.risk_score;
    if (sortOrder === 'desc') return b.risk_score - a.risk_score;
    return 0;
  });

  const graphNodes = bonusInsights?.graph.nodes.map((node, index) => {
    const isSystem = node.type === 'system';
    const systemIndex = bonusInsights.graph.nodes.slice(0, index).filter(item => item.type === 'system').length;
    const userIndex = bonusInsights.graph.nodes.slice(0, index).filter(item => item.type === 'user').length;

    return {
      ...node,
      x: isSystem ? 430 : 78,
      y: isSystem ? 44 + (systemIndex % 9) * 38 : 38 + (userIndex % 12) * 30
    };
  }) || [];
  const graphPositions = graphNodes.reduce<Record<string, { x: number; y: number }>>((positions, node) => {
    positions[node.id] = {
      x: node.x,
      y: node.y
    };

    return positions;
  }, {});

  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder('none');
  };

  const toggleActionCheckbox = (key: string) => {
    setCompletedActions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submitFeedback = async (label: 'true_positive' | 'false_positive') => {
    if (!selectedAccount) return;

    try {
      await axios.post(`${API_BASE_URL}/api/feedback/${selectedAccount.user_id}/${label}`);
      const bonusResponse = await axios.get<BonusInsights>(`${API_BASE_URL}/api/bonus-insights`);
      setBonusInsights(bonusResponse.data);
    } catch (error) {
      console.warn("Feedback loop is unavailable while operating on fallback data.");
    }
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const sectionMap: Record<string, HTMLDivElement | null> = {
      dashboard: dashboardRef.current,
      users: usersRef.current,
      events: eventsRef.current,
      reports: reportsRef.current,
      graph: graphRef.current
    };

    sectionMap[id]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const isolateSelectedIdentity = () => {
    if (!selectedAccount) return;

    setIsolatedIdentities(prev => ({
      ...prev,
      [selectedAccount.user_id]: true
    }));
  };

  const getSeverityStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL': return 'bg-[#FFF5F5] text-[#C53030] border-[#FEB2B2]';
      case 'HIGH': return 'bg-[#FFFAF0] text-[#DD6B20] border-[#FEEBC8]';
      case 'MEDIUM': return 'bg-[#FFFDF5] text-[#D69E2E] border-[#FEEBC8]';
      default: return 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#FDFBF7] flex flex-col items-center justify-center space-y-2">
        <div className="w-5 h-5 border-2 border-[#DCD6CD] border-t-[#4F46E5] rounded-full animate-spin"></div>
        <p className="text-[11px] font-medium text-[#7C7267] tracking-wider">Loading Security Matrix...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#FDFBF7] text-[#2C2520] font-sans antialiased flex overflow-hidden select-none">

      {/* 1. LEFT SIDE NAVIGATION */}
      <aside className="w-60 bg-white border-r border-[#EAE3D2] flex flex-col justify-between shrink-0 shadow-sm z-10">
        <div className="flex flex-col w-full">
          <div className="h-16 px-6 flex items-center space-x-2.5 border-b border-[#EAE3D2]/60">
            <div className="w-7 h-7 bg-[#4F46E5] text-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <Shield size={14} fill="currentColor" />
            </div>
            <span className="font-bold text-sm tracking-tight text-[#1E293B]">IdentityGuard</span>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'events', label: 'Events', icon: Clock3 },
              { id: 'reports', label: 'Reports', icon: Database }
            ].map((item) => {
              const IconComponent = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-3 transition-colors ${isSelected ? 'bg-[#EAE3D2] text-[#1E293B]' : 'text-[#7C7267] hover:text-[#2C2520] hover:bg-[#FDFBF7]'
                    }`}
                >
                  <IconComponent size={15} className={isSelected ? 'text-[#4F46E5]' : 'text-[#A0968A]'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#EAE3D2]/60 space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
              <span className="text-[10px] font-bold text-[#137333] tracking-wide uppercase">Core Active</span>
            </div>
            <button className="p-1.5 text-[#7C7267] hover:text-[#2C2520] bg-white border border-[#EAE3D2] rounded-lg shadow-sm">
              <Bell size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* WORKSPACE CONTENT LAYOUT FRAME */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP STATUS HEADER BAR */}
        <header className="h-16 border-b border-[#EAE3D2] bg-white px-8 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4F46E5]">Overview Engine</span>
            <h1 className="text-lg font-bold tracking-tight text-[#1E293B]">Dashboard Overview</h1>
          </div>
          <div className="text-[10px] font-mono text-[#7C7267] bg-white border border-[#EAE3D2] px-3 py-1 rounded-md shadow-sm">
            localhost:5173 • live refresh 10s
          </div>
        </header>

        {/* INNER SCROLLABLE CANVAS */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FDFBF7]">

          {/* 2. RISK SUMMARY HEADER COMPONENT */}
          <div ref={dashboardRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full shrink-0">
            <div className="bg-white border border-[#EAE3D2] rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Total Users</span>
                  <p className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">{metrics.total_users.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-[#FDFBF7] border border-[#EAE3D2] text-[#7C7267] rounded-xl"><Users size={15} /></div>
              </div>
            </div>
            <div className="bg-white border border-[#EAE3D2] rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Critical Alerts</span>
                  <p className="text-2xl font-extrabold text-[#C53030] tracking-tight mt-1">{metrics.critical_alerts}</p>
                </div>
                <div className="p-2 bg-[#FFF5F5] border border-[#FEB2B2] text-[#C53030] rounded-xl"><AlertTriangle size={15} /></div>
              </div>
            </div>
            <div className="bg-white border border-[#EAE3D2] rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Stale Admins Count</span>
                  <p className="text-2xl font-extrabold text-[#DD6B20] tracking-tight mt-1">{metrics.risks_detected}</p>
                </div>
                <div className="p-2 bg-[#FFFAF0] border border-[#FEEBC8] text-[#DD6B20] rounded-xl"><Clock size={15} /></div>
              </div>
            </div>
            <div className="bg-white border border-[#EAE3D2] rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Service Accounts Flagged</span>
                  <p className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">{bonusInsights?.sod_violations.length || 14}</p>
                </div>
                <div className="p-2 bg-[#EBF8FF] border border-[#BEE3F8] text-[#2B6CB0] rounded-xl"><Database size={15} /></div>
              </div>
            </div>
          </div>

          {/* SPLIT SCREEN WORKSPACE: INVENTORY TABLE LEFT, AI ANALYSIS RIGHT */}
          <div className="grid grid-cols-1 xl:grid-cols-[4fr,3fr] gap-6 items-start">

            {/* 3. ALERTS TABLE COMPONENT */}
            <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm flex flex-col">
              <div className="p-4 border-b border-[#EAE3D2] bg-white flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Identity Risk Inventory</h3>
                <span className="text-[10px] font-bold bg-[#FDFBF7] text-[#7C7267] border border-[#EAE3D2] px-2.5 py-0.5 rounded-md">
                  Click any row to run analysis
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE3D2] text-[10px] uppercase tracking-wider text-[#7C7267] font-bold bg-[#FDFBF7]">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Privilege</th>
                      <th className="py-3 px-4 cursor-pointer hover:bg-[#EAE3D2]/30 text-center" onClick={toggleSort}>
                        <div className="flex items-center justify-center space-x-1">
                          <span>Score</span>
                          {sortOrder === 'desc' ? <ArrowDown size={12} className="text-[#4F46E5]" /> : <ArrowUp size={12} className="text-[#4F46E5]" />}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-right">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D2]/60 text-xs">
                    {sortedAccounts.map((account) => {
                      const isSelected = selectedAccount?.user_id === account.user_id;
                      return (
                        <tr
                          key={account.user_id}
                          onClick={() => setSelectedAccount(account)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#EAE3D2]/40 font-medium border-l-4 border-l-[#4F46E5]' : 'hover:bg-[#FDFBF7]'}`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-[10px] transition-colors uppercase ${isSelected ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-[#EAE3D2] text-[#1E293B] border-[#DCD6CD]'
                                }`}>
                                {account.username.charAt(0)}
                              </div>
                              <span className="text-[#1E293B] font-semibold">{account.username}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[#7C7267]">{account.department}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F7FAFC] text-[#4A5568] border border-[#E2E8F0]">
                              {account.role_title}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-[#1E293B]">{account.risk_score}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${getSeverityStyles(account.risk_level)}`}>
                              {account.risk_level}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. AI INVESTIGATION NARRATIVE DETAIL PANEL (DEMO MOMENT) */}
            <div className="bg-white border border-[#EAE3D2] rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300">
              {selectedAccount ? (
                <div className="flex flex-col w-full">

                  {/* Panel Header */}
                  <div className="p-4 bg-[#FDFBF7] border-b border-[#EAE3D2] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] rounded-lg">
                        <Sparkles size={14} className="animate-pulse" />
                      </div>
                      <h3 className="text-xs font-black uppercase text-[#1E293B] tracking-wider">Aegis AI Copilot Investigation</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border font-mono ${getSeverityStyles(selectedAccount.risk_level)}`}>
                      Score {selectedAccount.risk_score}/100
                    </span>
                  </div>

                  {/* Panel Body */}
                  <div className="p-5 space-y-5">

                    {/* Element A: Selected Target Metadata */}
                    <div className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#1E293B]">{selectedAccount.username}</p>
                        <p className="text-[10px] text-[#7C7267] mt-0.5">{selectedAccount.role_title} • {selectedAccount.department}</p>
                      </div>
                      <div className="text-right text-[10px] font-mono text-[#7C7267]">
                        ID: {selectedAccount.user_id}
                      </div>
                    </div>

                    {/* Element B: LLM Natural Language Narrative */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-[#7C7267] uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles size={12} className="text-[#4F46E5]" />
                        <span>Autonomous Risk Narrative</span>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs text-[#334155] leading-relaxed relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#EEF2FF]/30 rounded-full blur-xl -mr-6 -mt-6" />
                        <span className="font-semibold text-[#1E293B]">{selectedAccount.username}</span>: {selectedAccount.risk_narrative || 'Backend telemetry indicates this account should be reviewed by the security team to validate business justification and ensure least-privilege access.'}
                      </div>
                    </div>

                    {/* Element C: List of Suspicious Events */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#7C7267] uppercase tracking-wider flex items-center space-x-1">
                        <Fingerprint size={12} className="text-[#7C7267]" />
                        <span>Suspicious Telemetry Events Matrix</span>
                      </div>
                      <div className="space-y-2">
                        {selectedAccount.findings.map((item, idx) => (
                          <div key={idx} className="flex items-start space-x-2.5 bg-white border border-[#EAE3D2] rounded-xl p-3 shadow-sm hover:border-[#4F46E5]/40 transition-colors">
                            <CornerDownRight size={14} className="text-[#A0968A] shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#1E293B] capitalize">
                                  {item.finding.replace(/_/g, ' ')}
                                </span>
                                <span className={`text-[9px] font-bold font-mono border px-1.5 rounded ${getSeverityStyles(item.severity)}`}>
                                  {item.severity}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#7C7267] leading-normal">{item.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Element D: Recommended Playbook Actions Checklist */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-[#7C7267] uppercase tracking-wider flex items-center space-x-1">
                        <CheckSquare size={12} className="text-[#7C7267]" />
                        <span>Recommended Playbook Countermeasures</span>
                      </div>
                      <div className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl overflow-hidden divide-y divide-[#EAE3D2]/60">
                        {selectedAccount.suggested_actions.map((action, idx) => {
                          const actionKey = `${selectedAccount.user_id}-${idx}`;
                          const isDone = !!completedActions[actionKey];
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleActionCheckbox(actionKey)}
                              className="p-3 flex items-start space-x-3 cursor-pointer hover:bg-[#EAE3D2]/20 transition-colors"
                            >
                              <div className="mt-0.5 shrink-0 text-[#4F46E5]">
                                {isDone ? <CheckSquare size={14} /> : <Square size={14} className="text-[#A0968A]" />}
                              </div>
                              <span className={`text-xs font-medium transition-all ${isDone ? 'line-through text-[#A0968A]' : 'text-[#2C2520]'}`}>
                                {action}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Escalation Drawer Control */}
                    <div className="pt-2 border-t border-[#EAE3D2]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px]">
                      <span className="text-[#7C7267] font-medium">
                        Escalation Target: <span className="font-mono text-[#1E293B]">{selectedAccount.next_escalation}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => submitFeedback('false_positive')} className="px-3 py-1.5 bg-white text-[#7C7267] text-xs font-bold rounded-lg border border-[#EAE3D2] shadow-sm hover:text-[#C53030] transition-all">
                          False Positive
                        </button>
                        <button onClick={() => submitFeedback('true_positive')} className="px-3 py-1.5 bg-white text-[#7C7267] text-xs font-bold rounded-lg border border-[#EAE3D2] shadow-sm hover:text-[#137333] transition-all">
                          Confirm Risk
                        </button>
                        <button className="px-4 py-1.5 bg-[#4F46E5] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#4338CA] flex items-center space-x-1 transition-all">
                          <span>Isolate Identity</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="p-12 text-center text-[#7C7267] text-xs font-medium space-y-1">
                  <ShieldAlert size={20} className="mx-auto text-[#A0968A] mb-2" />
                  <p>No entity workspace active.</p>
                  <p className="text-[10px] text-[#A0968A]">Select any inventory node user row to trigger autonomous AI investigation sequences.</p>
                </div>
              )}
            </div>

          </div>

          {bonusInsights && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#4F46E5]">Bonus Intelligence Layer</span>
                  <h2 className="text-sm font-black tracking-tight text-[#1E293B]">Advanced Identity Risk Controls</h2>
                </div>
                <div className="text-[10px] font-mono text-[#7C7267] bg-white border border-[#EAE3D2] px-3 py-1 rounded-md shadow-sm">
                  Updated {new Date(bonusInsights.generated_at).toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-6">
                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Interactive Privilege Graph</h3>
                    <span className="text-[10px] font-bold bg-[#FDFBF7] text-[#7C7267] border border-[#EAE3D2] px-2.5 py-0.5 rounded-md">
                      NetworkX-style access map
                    </span>
                  </div>
                  <div className="p-4">
                    <img
                      src="http://127.0.0.1:8000/api/graph"
                      alt="Identity Risk Graph"
                      className="w-full rounded-xl border border-[#EAE3D2] shadow-sm"
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Real-time Alert Feed</h3>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
                  </div>
                  <div className="divide-y divide-[#EAE3D2]/60">
                    {bonusInsights.live_alerts.map((alert) => (
                      <div key={alert.id} className="p-4 space-y-1 hover:bg-[#FDFBF7] transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-[#1E293B]">{alert.username}</span>
                          <span className={`text-[9px] font-bold font-mono border px-1.5 rounded ${getSeverityStyles(alert.risk_level)}`}>
                            {alert.risk_level} • {alert.score}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7C7267] leading-normal line-clamp-2">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider mb-3">Behavioral Clustering</h3>
                  <div className="space-y-3">
                    {bonusInsights.clusters.map((cluster) => (
                      <div key={cluster.name} className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E293B]">{cluster.name}</span>
                          <span className="text-[10px] font-mono text-[#4F46E5]">{cluster.count} users</span>
                        </div>
                        <p className="text-[11px] text-[#7C7267] mt-1">Average score {cluster.average_score}</p>
                        <p className="text-[10px] text-[#A0968A] mt-2 uppercase font-bold">{cluster.top_findings.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider mb-3">Breach Impact Simulation</h3>
                  <div className="space-y-3">
                    {bonusInsights.impact_simulations.slice(0, 4).map((impact) => (
                      <div key={impact.user_id} className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E293B]">{impact.username}</span>
                          <span className="text-[10px] font-mono font-bold text-[#C53030]">{impact.blast_radius_score}</span>
                        </div>
                        <p className="text-[11px] text-[#7C7267] mt-1">{impact.likely_impact}</p>
                        <p className="text-[10px] text-[#A0968A] mt-2">{impact.sensitive_systems.join(' • ') || impact.systems_at_risk.join(' • ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider mb-3">Feedback Learning Loop</h3>
                  <div className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-4">
                    <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Analyst Reviews</span>
                    <p className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">{bonusInsights.feedback_summary.reviewed}</p>
                    <p className="text-[11px] text-[#7C7267] mt-2">False positive rate {(bonusInsights.feedback_summary.false_positive_rate * 100).toFixed(0)}%</p>
                    <p className="text-[11px] text-[#4F46E5] font-semibold mt-3">{bonusInsights.feedback_summary.learning_mode}</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {bonusInsights.integrations.map((integration) => (
                      <div key={integration.provider} className="flex items-center justify-between text-[11px] border border-[#EAE3D2] rounded-lg px-3 py-2">
                        <span className="font-bold text-[#1E293B]">{integration.provider}</span>
                        <span className="font-mono text-[#7C7267]">{integration.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Multi-system Correlation</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                    {bonusInsights.correlated_systems.map((item) => (
                      <div key={item.system} className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1E293B]">{item.system}</span>
                          <span className="text-[10px] font-mono text-[#DD6B20]">{item.high_risk_users} high</span>
                        </div>
                        <p className="text-[11px] text-[#7C7267] mt-1">{item.correlation}</p>
                        <p className="text-[10px] text-[#A0968A] mt-2">{item.linked_risks} linked risks</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Organizational Anomaly Detection</h3>
                  </div>
                  <div className="divide-y divide-[#EAE3D2]/60">
                    {bonusInsights.org_anomalies.map((item) => (
                      <div key={item.department} className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">{item.department}</p>
                          <p className="text-[11px] text-[#7C7267] mt-1">{item.signal}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-[#DD6B20]">{item.average_risk}</p>
                          <p className="text-[10px] text-[#A0968A]">{item.flagged_users} users</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Separation of Duties</h3>
                  </div>
                  <div className="divide-y divide-[#EAE3D2]/60">
                    {bonusInsights.sod_violations.map((item) => (
                      <div key={item.user_id} className="p-3">
                        <p className="text-xs font-bold text-[#1E293B]">{item.username}</p>
                        <p className="text-[10px] text-[#7C7267] mt-1">{item.department}</p>
                        <p className="text-[11px] text-[#C53030] mt-2">{item.conflicts.join('; ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Compliance Gap Analysis</h3>
                  </div>
                  <div className="divide-y divide-[#EAE3D2]/60">
                    {bonusInsights.compliance_gaps.slice(0, 6).map((item) => (
                      <div key={item.system} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">{item.system}</p>
                          <p className="text-[11px] text-[#7C7267] mt-1">{item.gap}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#DD6B20]">{item.high_risk_users}/{item.flagged_users}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] bg-white">
                    <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">DLP Risk Response</h3>
                  </div>
                  <div className="divide-y divide-[#EAE3D2]/60">
                    {bonusInsights.dlp_actions.map((item) => (
                      <div key={`${item.user_id}-${item.resource}`} className="p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[#1E293B]">{item.username}</p>
                          <span className={`text-[9px] font-bold font-mono border px-1.5 rounded ${getSeverityStyles(item.risk_level)}`}>
                            {item.risk_level}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7C7267] mt-1">{item.resource}</p>
                        <p className="text-[11px] text-[#C53030] font-semibold mt-2">{item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
