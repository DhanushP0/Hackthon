// src/app.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield,
  AlertTriangle,
  Clock,
  Bell,
  Users,
  Database,
  LayoutDashboard,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Fingerprint,
  CornerDownRight,
  CheckSquare,
  Square,
  Search,
  Settings,
  FileText,
  Clock3,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import type { RiskAccount, DashboardMetrics, BonusInsights } from './types';
import { BUILT_IN_MOCK_ACCOUNTS, MOCK_METRICS } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

type TabId = 'dashboard' | 'users' | 'events' | 'reports' | 'settings';

const TAB_META: Record<TabId, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: 'Overview Engine', title: 'Dashboard' },
  users: { eyebrow: 'Identity Layer', title: 'Users' },
  events: { eyebrow: 'Telemetry Feed', title: 'Events' },
  reports: { eyebrow: 'Reporting Engine', title: 'Reports' },
  settings: { eyebrow: 'Configuration', title: 'Settings' },
};

export default function App() {
  const [accounts, setAccounts] = useState<RiskAccount[]>(BUILT_IN_MOCK_ACCOUNTS);
  const [metrics, setMetrics] = useState<DashboardMetrics>(MOCK_METRICS);
  const [bonusInsights, setBonusInsights] = useState<BonusInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const [selectedAccount, setSelectedAccount] = useState<RiskAccount | null>(BUILT_IN_MOCK_ACCOUNTS[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('desc');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [showAllUsers, setShowAllUsers] = useState<boolean>(false);

  // Interactive full-screen view state for NetworkX visualization
  const [isGraphExpanded, setIsGraphExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [metricsResponse, accountsResponse, bonusResponse] = await Promise.all([
          axios.get<DashboardMetrics>(`${API_BASE_URL}/api/metrics`),
          axios.get<RiskAccount[]>(`${API_BASE_URL}/api/risky-accounts`),
          axios.get<BonusInsights>(`${API_BASE_URL}/api/bonus-insights`),
        ]);
        if (metricsResponse.data) setMetrics(metricsResponse.data);
        if (bonusResponse.data) setBonusInsights(bonusResponse.data);
        if (accountsResponse.data && accountsResponse.data.length > 0) {
          setAccounts(accountsResponse.data);
          setSelectedAccount(prev =>
            !prev ? accountsResponse.data[0]
              : accountsResponse.data.find(a => a.user_id === prev.user_id) || accountsResponse.data[0]
          );
        }
      } catch {
        console.warn('Operating on local mockData fallback engines.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const id = window.setInterval(fetchDashboardData, 10000);
    return () => window.clearInterval(id);
  }, []);

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortOrder === 'asc') return a.risk_score - b.risk_score;
    if (sortOrder === 'desc') return b.risk_score - a.risk_score;
    return 0;
  });

  const toggleSort = () => {
    setSortOrder(o => o === 'none' ? 'desc' : o === 'desc' ? 'asc' : 'none');
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
    } catch {
      console.warn('Feedback loop is unavailable while operating on fallback data.');
    }
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
        <div className="w-5 h-5 border-2 border-[#DCD6CD] border-t-[#4F46E5] rounded-full animate-spin" />
        <p className="text-[11px] font-medium text-[#7C7267] tracking-wider">Loading Security Matrix…</p>
      </div>
    );
  }

  // ─── NAV ITEMS ────────────────────────────────────────────────────────────
  const coreNav: { id: TabId; label: string; icon: React.FC<{ size?: number; className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: accounts.filter(a => a.risk_level === 'CRITICAL').length },
    { id: 'events', label: 'Events', icon: Clock3, badge: 12 },
  ];
  const reportNav: { id: TabId; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen w-screen bg-[#FDFBF7] text-[#2C2520] font-sans antialiased flex overflow-hidden select-none">

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside className="w-56 bg-white border-r border-[#EAE3D2] flex flex-col shrink-0 shadow-sm z-10">

        {/* Logo */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-[#EAE3D2]/60 shrink-0">
          <div className="w-7 h-7 bg-[#4F46E5] text-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Shield size={14} fill="currentColor" />
          </div>
          <span className="font-bold text-sm tracking-tight text-[#1E293B]">IdentityGuard</span>
        </div>

        {/* Core nav */}
        <nav className="p-3 pt-4 space-y-0.5">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#A0968A] px-2 mb-1.5">Core</p>
          {coreNav.map(({ id, label, icon: Icon, badge }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative w-full px-2.5 py-2 rounded-lg text-[12.5px] font-medium flex items-center gap-2.5 transition-colors ${active
                  ? 'bg-[#EAE3D2] text-[#1E293B]'
                  : 'text-[#7C7267] hover:text-[#2C2520] hover:bg-[#F5F0E8]'
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#4F46E5] rounded-r-full" />
                )}
                <Icon size={15} className={active ? 'text-[#4F46E5]' : 'text-[#A0968A]'} />
                <span className="flex-1 text-left">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="text-[9.5px] font-bold bg-[#FFF5F5] text-[#C53030] border border-[#FEB2B2] px-1.5 py-0.5 rounded-full leading-none">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Reports nav */}
        <nav className="px-3 pb-2 space-y-0.5">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#A0968A] px-2 mb-1.5 mt-3">Reports</p>
          {reportNav.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative w-full px-2.5 py-2 rounded-lg text-[12.5px] font-medium flex items-center gap-2.5 transition-colors ${active
                  ? 'bg-[#EAE3D2] text-[#1E293B]'
                  : 'text-[#7C7267] hover:text-[#2C2520] hover:bg-[#F5F0E8]'
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-[#4F46E5] rounded-r-full" />
                )}
                <Icon size={15} className={active ? 'text-[#4F46E5]' : 'text-[#A0968A]'} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto p-3 border-t border-[#EAE3D2]/60">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
            <span className="text-[10px] font-bold text-[#137333] tracking-wide uppercase flex-1">Core Active</span>
            <button className="p-1.5 text-[#7C7267] hover:text-[#2C2520] bg-white border border-[#EAE3D2] rounded-lg shadow-sm">
              <Bell size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-14 border-b border-[#EAE3D2] bg-white px-6 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4F46E5]">
              {TAB_META[activeTab].eyebrow}
            </span>
            <h1 className="text-[15px] font-bold tracking-tight text-[#1E293B] leading-tight">
              {TAB_META[activeTab].title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] text-[#7C7267] border border-[#EAE3D2] rounded-lg bg-white hover:bg-[#FDFBF7] transition-colors">
              <Search size={13} /> Search
            </button>
            <button className="p-1.5 text-[#7C7267] border border-[#EAE3D2] rounded-lg bg-white hover:bg-[#FDFBF7] transition-colors">
              <Bell size={14} />
            </button>
            <div className="text-[10px] font-mono text-[#7C7267] bg-white border border-[#EAE3D2] px-2.5 py-1 rounded-md shadow-sm">
              live · 10s
            </div>
          </div>
        </header>

        {/* Scrollable canvas */}
        <div className="flex-1 overflow-y-auto bg-[#FDFBF7]">

          {/* ── DASHBOARD TAB ─────────────────────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <div className="p-5 space-y-5">

              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Total Users</span>
                      <p className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">{metrics.total_users.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-[#EBF8FF] border border-[#BEE3F8] text-[#2B6CB0] rounded-xl"><Users size={15} /></div>
                  </div>
                </div>
                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Critical Alerts</span>
                      <p className="text-2xl font-extrabold text-[#C53030] tracking-tight mt-1">{metrics.critical_alerts}</p>
                    </div>
                    <div className="p-2 bg-[#FFF5F5] border border-[#FEB2B2] text-[#C53030] rounded-xl"><AlertTriangle size={15} /></div>
                  </div>
                </div>
                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Stale Admins</span>
                      <p className="text-2xl font-extrabold text-[#DD6B20] tracking-tight mt-1">{metrics.risks_detected}</p>
                    </div>
                    <div className="p-2 bg-[#FFFAF0] border border-[#FEEBC8] text-[#DD6B20] rounded-xl"><Clock size={15} /></div>
                  </div>
                </div>
                <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Svc Accounts Flagged</span>
                      <p className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">{bonusInsights?.sod_violations.length ?? 14}</p>
                    </div>
                    <div className="p-2 bg-[#FDFBF7] border border-[#EAE3D2] text-[#7C7267] rounded-xl"><Database size={15} /></div>
                  </div>
                </div>
              </div>

              {/* Split: table + AI panel */}
              <div className="grid grid-cols-1 xl:grid-cols-[4fr,3fr] gap-5">

                {/* Alerts table */}
                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2] flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Identity Risk Inventory</h3>
                    <span className="text-[10px] font-bold bg-[#FDFBF7] text-[#7C7267] border border-[#EAE3D2] px-2 py-0.5 rounded-md">
                      Click any row to analyse
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#EAE3D2] text-[10px] uppercase tracking-wider text-[#7C7267] font-bold bg-[#FDFBF7]">
                          <th className="py-2.5 px-4">User</th>
                          <th className="py-2.5 px-4">Department</th>
                          <th className="py-2.5 px-4">Privilege</th>
                          <th
                            className="py-2.5 px-4 cursor-pointer hover:bg-[#EAE3D2]/30 text-center"
                            onClick={toggleSort}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Score</span>
                              {sortOrder === 'desc'
                                ? <ArrowDown size={11} className="text-[#4F46E5]" />
                                : <ArrowUp size={11} className="text-[#4F46E5]" />}
                            </div>
                          </th>
                          <th className="py-2.5 px-4 text-right">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3D2]/60 text-xs">
                        {/* Slices the array to 10 rows unless showAllUsers is true */}
                        {sortedAccounts.slice(0, showAllUsers ? sortedAccounts.length : 10).map(account => {
                          const isSelected = selectedAccount?.user_id === account.user_id;
                          return (
                            <tr
                              key={account.user_id}
                              onClick={() => setSelectedAccount(account)}
                              className={`cursor-pointer transition-colors ${isSelected
                                ? 'bg-[#EAE3D2]/40 font-medium border-l-4 border-l-[#4F46E5]'
                                : 'hover:bg-[#FDFBF7]'
                                }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-[10px] uppercase ${isSelected
                                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                                    : 'bg-[#EAE3D2] text-[#1E293B] border-[#DCD6CD]'
                                    }`}>
                                    {account.username.charAt(0)}
                                  </div>
                                  <span className="text-[#1E293B] font-semibold">{account.username}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[#7C7267]">{account.department}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F7FAFC] text-[#4A5568] border border-[#E2E8F0]">
                                  {account.role_title}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-[#1E293B]">{account.risk_score}</td>
                              <td className="py-3 px-4 text-right">
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

                  {/* Expand / Collapse Footer Toolbar */}
                  <div className="p-3 border-t border-[#EAE3D2] bg-white flex items-center justify-center">
                    <button
                      onClick={() => setShowAllUsers(!showAllUsers)}
                      className="flex items-center gap-1 px-4 py-1.5 border border-[#EAE3D2] rounded-lg bg-[#FDFBF7] hover:bg-[#F5F0E8] text-[#7C7267] hover:text-[#2C2520] font-bold text-[11px] uppercase tracking-wide transition-colors shadow-sm"
                    >
                      {showAllUsers ? (
                        <>
                          Show Less <ArrowUp size={12} className="text-[#4F46E5]" />
                        </>
                      ) : (
                        <>
                          Show All ({sortedAccounts.length}) <ArrowDown size={12} className="text-[#4F46E5]" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Investigation panel */}
                <div className="bg-white border border-[#EAE3D2] rounded-xl shadow-md overflow-hidden h-fit">
                  {selectedAccount ? (
                    <div className="flex flex-col w-full">
                      <div className="p-4 bg-[#FDFBF7] border-b border-[#EAE3D2] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] rounded-lg">
                            <Sparkles size={13} className="animate-pulse" />
                          </div>
                          <h3 className="text-[11px] font-black uppercase text-[#1E293B] tracking-wider">Risk Investigation Engine</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border font-mono ${getSeverityStyles(selectedAccount.risk_level)}`}>
                          Score {selectedAccount.risk_score}/100
                        </span>
                      </div>

                      <div className="p-4 space-y-4 overflow-y-auto">
                        {/* Target metadata */}
                        <div className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#1E293B]">{selectedAccount.username}</p>
                            <p className="text-[10px] text-[#7C7267] mt-0.5">{selectedAccount.role_title} · {selectedAccount.department}</p>
                          </div>
                          <div className="text-right text-[10px] font-mono text-[#7C7267]">
                            ID: {selectedAccount.user_id}
                          </div>
                        </div>

                        {/* Risk narrative */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-[#7C7267] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} className="text-[#4F46E5]" />
                            Autonomous Risk Narrative
                          </div>
                          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-[#334155] leading-relaxed">
                            <span className="font-semibold text-[#1E293B]">{selectedAccount.username}</span>:{' '}
                            {selectedAccount.risk_narrative ?? 'Backend telemetry indicates this account should be reviewed by the security team to validate business justification and ensure least-privilege access.'}
                          </div>
                        </div>

                        {/* Findings */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-[#7C7267] uppercase tracking-wider flex items-center gap-1">
                            <Fingerprint size={11} className="text-[#7C7267]" />
                            Suspicious Telemetry Events
                          </div>
                          <div className="space-y-1.5">
                            {selectedAccount.findings.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 bg-white border border-[#EAE3D2] rounded-xl p-3 shadow-sm hover:border-[#4F46E5]/40 transition-colors">
                                <CornerDownRight size={13} className="text-[#A0968A] shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-0.5">
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

                        {/* Playbook checklist */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold text-[#7C7267] uppercase tracking-wider flex items-center gap-1">
                            <CheckSquare size={11} className="text-[#7C7267]" />
                            Recommended Countermeasures
                          </div>
                          <div className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl overflow-hidden divide-y divide-[#EAE3D2]/60">
                            {selectedAccount.suggested_actions.map((action, idx) => {
                              const key = `${selectedAccount.user_id}-${idx}`;
                              const done = !!completedActions[key];
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleActionCheckbox(key)}
                                  className="p-3 flex items-start gap-3 cursor-pointer hover:bg-[#EAE3D2]/20 transition-colors"
                                >
                                  <div className="mt-0.5 shrink-0 text-[#4F46E5]">
                                    {done ? <CheckSquare size={13} /> : <Square size={13} className="text-[#A0968A]" />}
                                  </div>
                                  <span className={`text-xs font-medium transition-all ${done ? 'line-through text-[#A0968A]' : 'text-[#2C2520]'}`}>
                                    {action}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Escalation footer */}
                        <div className="pt-2 border-t border-[#EAE3D2]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px]">
                          <span className="text-[#7C7267] font-medium">
                            Escalation:{' '}
                            <span className="font-mono text-[#1E293B]">{selectedAccount.next_escalation}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => submitFeedback('false_positive')}
                              className="px-3 py-1.5 bg-white text-[#7C7267] text-xs font-bold rounded-lg border border-[#EAE3D2] shadow-sm hover:text-[#C53030] transition-all"
                            >
                              False Positive
                            </button>
                            <button
                              onClick={() => submitFeedback('true_positive')}
                              className="px-3 py-1.5 bg-white text-[#7C7267] text-xs font-bold rounded-lg border border-[#EAE3D2] shadow-sm hover:text-[#137333] transition-all"
                            >
                              Confirm Risk
                            </button>
                            <button className="px-3 py-1.5 bg-[#4F46E5] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#4338CA] flex items-center gap-1 transition-all">
                              Isolate <ArrowRight size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center text-[#7C7267] text-xs font-medium space-y-1">
                      <ShieldAlert size={20} className="mx-auto text-[#A0968A] mb-2" />
                      <p>No entity workspace active.</p>
                      <p className="text-[10px] text-[#A0968A]">Select any inventory row to trigger AI investigation.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bonus intelligence */}
              {bonusInsights && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#4F46E5]">Bonus Intelligence Layer</span>
                      <h2 className="text-sm font-black tracking-tight text-[#1E293B]">Advanced Identity Risk Controls</h2>
                    </div>
                    <div className="text-[10px] font-mono text-[#7C7267] bg-white border border-[#EAE3D2] px-2.5 py-1 rounded-md shadow-sm">
                      Updated {new Date(bonusInsights.generated_at).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[3fr,2fr] gap-5">
                    {/* Interactive Clickable Privilege Graph Panel */}
                    <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-[#EAE3D2] flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Interactive Privilege Graph</h3>
                        <span className="text-[10px] font-bold bg-[#FDFBF7] text-[#7C7267] border border-[#EAE3D2] px-2 py-0.5 rounded-md">NetworkX-style</span>
                      </div>
                      <div className="p-4">
                        <div
                          onClick={() => setIsGraphExpanded(true)}
                          className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-[#EAE3D2] shadow-sm bg-[#FDFBF7]"
                        >
                          <img
                            src={`${API_BASE_URL}/api/graph`}
                            alt="Identity Risk Graph"
                            className="w-full h-auto object-cover rounded-xl transition duration-200 group-hover:brightness-95"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition duration-200">
                            <span className="bg-white/90 backdrop-blur-sm border border-[#EAE3D2] text-[10px] font-bold text-[#7C7267] px-2.5 py-1.5 rounded-lg shadow-sm">
                              Click to Expand
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-[#EAE3D2] flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Real-time Alert Feed</h3>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
                      </div>
                      <div className="divide-y divide-[#EAE3D2]/60">
                        {bonusInsights.live_alerts.map(alert => (
                          <div key={alert.id} className="p-4 space-y-1 hover:bg-[#FDFBF7] transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-bold text-[#1E293B]">{alert.username}</span>
                              <span className={`text-[9px] font-bold font-mono border px-1.5 rounded ${getSeverityStyles(alert.risk_level)}`}>
                                {alert.risk_level} · {alert.score}
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
                      <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider mb-3">Behavioral Clustering</h3>
                      <div className="space-y-2.5">
                        {bonusInsights.clusters.map(cluster => (
                          <div key={cluster.name} className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1E293B]">{cluster.name}</span>
                              <span className="text-[10px] font-mono text-[#4F46E5]">{cluster.count} users</span>
                            </div>
                            <p className="text-[11px] text-[#7C7267] mt-1">Avg score {cluster.average_score}</p>
                            <p className="text-[10px] text-[#A0968A] mt-1.5 uppercase font-bold">{cluster.top_findings.join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                      <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider mb-3">Breach Impact Simulation</h3>
                      <div className="space-y-2.5">
                        {bonusInsights.impact_simulations.slice(0, 4).map(impact => (
                          <div key={impact.user_id} className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1E293B]">{impact.username}</span>
                              <span className="text-[10px] font-mono font-bold text-[#C53030]">{impact.blast_radius_score}</span>
                            </div>
                            <p className="text-[11px] text-[#7C7267] mt-1">{impact.likely_impact}</p>
                            <p className="text-[10px] text-[#A0968A] mt-1.5">
                              {(impact.sensitive_systems ?? impact.systems_at_risk ?? []).join(' · ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE3D2] rounded-xl p-4 shadow-sm">
                      <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider mb-3">Feedback Learning Loop</h3>
                      <div className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-4">
                        <span className="text-[10px] font-bold uppercase text-[#7C7267] tracking-wider block">Analyst Reviews</span>
                        <p className="text-2xl font-extrabold text-[#1E293B] tracking-tight mt-1">{bonusInsights.feedback_summary.reviewed}</p>
                        <p className="text-[11px] text-[#7C7267] mt-1.5">
                          False positive rate {(bonusInsights.feedback_summary.false_positive_rate * 100).toFixed(0)}%
                        </p>
                        <p className="text-[11px] text-[#4F46E5] font-semibold mt-2">{bonusInsights.feedback_summary.learning_mode}</p>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        {bonusInsights.integrations.map(integration => (
                          <div key={integration.provider} className="flex items-center justify-between text-[11px] border border-[#EAE3D2] rounded-lg px-3 py-2">
                            <span className="font-bold text-[#1E293B]">{integration.provider}</span>
                            <span className="font-mono text-[#7C7267]">{integration.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-[#EAE3D2]">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Multi-system Correlation</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        {bonusInsights.correlated_systems.map(item => (
                          <div key={item.system} className="bg-[#FDFBF7] border border-[#EAE3D2] rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#1E293B]">{item.system}</span>
                              <span className="text-[10px] font-mono text-[#DD6B20]">{item.high_risk_users} high</span>
                            </div>
                            <p className="text-[11px] text-[#7C7267] mt-1">{item.correlation}</p>
                            <p className="text-[10px] text-[#A0968A] mt-1.5">{item.linked_risks} linked risks</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-[#EAE3D2]">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Org Anomaly Detection</h3>
                      </div>
                      <div className="divide-y divide-[#EAE3D2]/60">
                        {bonusInsights.org_anomalies.map(item => (
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
                      <div className="p-4 border-b border-[#EAE3D2]">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Separation of Duties</h3>
                      </div>
                      <div className="divide-y divide-[#EAE3D2]/60">
                        {bonusInsights.sod_violations.map(item => (
                          <div key={item.user_id} className="p-3">
                            <p className="text-xs font-bold text-[#1E293B]">{item.username}</p>
                            <p className="text-[10px] text-[#7C7267] mt-1">{item.department}</p>
                            <p className="text-[11px] text-[#C53030] mt-1.5">{item.conflicts.join('; ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-[#EAE3D2]">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Compliance Gap Analysis</h3>
                      </div>
                      <div className="divide-y divide-[#EAE3D2]/60">
                        {bonusInsights.compliance_gaps.slice(0, 6).map(item => (
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
                      <div className="p-4 border-b border-[#EAE3D2]">
                        <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">DLP Risk Response</h3>
                      </div>
                      <div className="divide-y divide-[#EAE3D2]/60">
                        {bonusInsights.dlp_actions.map(item => (
                          <div key={`${item.user_id}-${item.resource}`} className="p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-[#1E293B]">{item.username}</p>
                              <span className={`text-[9px] font-bold font-mono border px-1.5 rounded ${getSeverityStyles(item.risk_level)}`}>
                                {item.risk_level}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7C7267] mt-1">{item.resource}</p>
                            <p className="text-[11px] text-[#C53030] font-semibold mt-1.5">{item.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B]">User inventory</h2>
                  <p className="text-[11px] text-[#7C7267] mt-0.5">{accounts.length} accounts · {accounts.filter(a => a.risk_level === 'CRITICAL').length} critical</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] text-[#7C7267] border border-[#EAE3D2] rounded-lg bg-white hover:bg-[#FDFBF7] transition-colors">
                  <Filter size={12} /> Filter
                </button>
              </div>

              <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#EAE3D2] flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">All accounts</h3>
                  <span className="text-[10px] font-bold bg-[#FDFBF7] text-[#7C7267] border border-[#EAE3D2] px-2 py-0.5 rounded-md">
                    {accounts.length} total
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#EAE3D2] text-[10px] uppercase tracking-wider text-[#7C7267] font-bold bg-[#FDFBF7]">
                        <th className="py-2.5 px-4">User</th>
                        <th className="py-2.5 px-4">Department</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4 text-center">Risk Score</th>
                        <th className="py-2.5 px-4 text-right">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D2]/60 text-xs">
                      {sortedAccounts.map(account => (
                        <tr
                          key={account.user_id}
                          onClick={() => { setSelectedAccount(account); setActiveTab('dashboard'); }}
                          className="cursor-pointer hover:bg-[#FDFBF7] transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#EAE3D2] border border-[#DCD6CD] flex items-center justify-center font-bold text-[10px] uppercase text-[#1E293B]">
                                {account.username.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-[#1E293B]">{account.username}</p>
                                <p className="text-[10px] text-[#7C7267]">ID: {account.user_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#7C7267]">{account.department}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#F7FAFC] text-[#4A5568] border border-[#E2E8F0]">
                              {account.role_title}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#1E293B]">{account.risk_score}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${getSeverityStyles(account.risk_level)}`}>
                              {account.risk_level}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── EVENTS TAB ────────────────────────────────────────────────── */}
          {activeTab === 'events' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1E293B]">Event feed</h2>
                  <p className="text-[11px] text-[#7C7267] mt-0.5">Live telemetry · last 24 hours</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#137333]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#137333] animate-pulse" />
                  Live
                </div>
              </div>

              <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#EAE3D2]">
                  <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Recent activity</h3>
                </div>
                <div className="divide-y divide-[#EAE3D2]/60">
                  {accounts.flatMap(account =>
                    account.findings.map((finding, i) => ({
                      id: `${account.user_id}-${i}`,
                      username: account.username,
                      department: account.department,
                      finding: finding.finding,
                      details: finding.details,
                      severity: finding.severity,
                    }))
                  ).slice(0, 20).map(event => (
                    <div key={event.id} className="p-4 flex items-start gap-3 hover:bg-[#FDFBF7] transition-colors">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${event.severity === 'CRITICAL' ? 'bg-[#C53030]'
                        : event.severity === 'HIGH' ? 'bg-[#DD6B20]'
                          : event.severity === 'MEDIUM' ? 'bg-[#D69E2E]'
                            : 'bg-[#2B6CB0]'
                        }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#1E293B]">{event.username}</span>
                          <span className="text-[10px] text-[#7C7267]">·</span>
                          <span className="text-[10px] text-[#7C7267]">{event.department}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#2C2520] mt-0.5 capitalize">{event.finding.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-[#7C7267] mt-0.5 leading-normal">{event.details}</p>
                      </div>
                      <span className={`text-[9px] font-bold font-mono border px-1.5 py-0.5 rounded shrink-0 ${getSeverityStyles(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── REPORTS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#1E293B]">Reports</h2>
                <p className="text-[11px] text-[#7C7267] mt-0.5">Scheduled and on-demand security exports</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Weekly risk summary', desc: 'All flagged users with scores, findings, and trend data', icon: Activity, color: 'bg-[#EBF8FF] text-[#2B6CB0]' },
                  { name: 'Compliance gap report', desc: 'SOX, ISO 27001, SOC2 — access control gaps by system', icon: AlertCircle, color: 'bg-[#FFFAF0] text-[#DD6B20]' },
                  { name: 'Privilege audit trail', desc: 'Full access log with timestamps for all admin accounts', icon: CheckCircle, color: 'bg-[#F0FFF4] text-[#276749]' },
                  { name: 'SoD violation digest', desc: 'Separation-of-duties conflicts broken down by department', icon: XCircle, color: 'bg-[#FFF5F5] text-[#C53030]' },
                ].map(report => {
                  const Icon = report.icon;
                  return (
                    <div key={report.name} className="bg-white border border-[#EAE3D2] rounded-xl p-4 flex items-center gap-4 hover:bg-[#FDFBF7] transition-colors cursor-pointer shadow-sm">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${report.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1E293B]">{report.name}</p>
                        <p className="text-[11px] text-[#7C7267] mt-0.5">{report.desc}</p>
                      </div>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-[#7C7267] border border-[#EAE3D2] rounded-lg bg-white hover:bg-[#FDFBF7] transition-colors shrink-0">
                        <Download size={12} /> Download
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'settings' && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#1E293B]">Settings</h2>
                <p className="text-[11px] text-[#7C7267] mt-0.5">Integrations, thresholds, and notification config</p>
              </div>

              {bonusInsights && (
                <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-[#EAE3D2]">
                    <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Integrations</h3>
                  </div>
                  <div className="divide-y divide-[#EAE3D2]/60">
                    {bonusInsights.integrations.map(integration => (
                      <div key={integration.provider} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#1E293B]">{integration.provider}</p>
                          <p className="text-[10px] text-[#7C7267] mt-0.5 font-mono">{integration.status}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.status.toLowerCase().includes('active') || integration.status.toLowerCase().includes('connect') ? (
                            <CheckCircle size={14} className="text-[#276749]" />
                          ) : (
                            <XCircle size={14} className="text-[#C53030]" />
                          )}
                          <button className="px-3 py-1.5 text-[11px] text-[#7C7267] border border-[#EAE3D2] rounded-lg bg-white hover:bg-[#FDFBF7] transition-colors">
                            Configure
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-[#EAE3D2]">
                  <h3 className="text-[11px] font-bold uppercase text-[#7C7267] tracking-wider">Risk thresholds</h3>
                </div>
                <div className="p-4 space-y-4">
                  {[
                    { label: 'Critical threshold', value: 80, color: '#C53030' },
                    { label: 'High threshold', value: 60, color: '#DD6B20' },
                    { label: 'Medium threshold', value: 40, color: '#D69E2E' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-xs font-medium text-[#2C2520]">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <div className="flex-1 h-1 bg-[#EAE3D2] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[#1E293B] w-6 text-right">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── EXPANDABLE DETACHED MODAL OVERLAY ── */}
      {isGraphExpanded && (
        <div
          onClick={() => setIsGraphExpanded(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDFBF7]/95 backdrop-blur-md p-6 sm:p-12 cursor-zoom-out animate-in fade-in duration-200"
        >
          {/* Floating HUD controls for extraction reference */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-[#7C7267] text-[11px] font-bold uppercase tracking-wider select-none pointer-events-none">
            <div>Identity Risk Matrix / Pipeline Topology Graph</div>
            <button className="bg-white border border-[#EAE3D2] text-xs px-3 py-1.5 rounded-xl shadow-sm pointer-events-auto hover:bg-[#F5F0E8] text-[#2C2520] transition-colors">
              Close (Esc)
            </button>
          </div>

          {/* Maximized structural layout image frame context */}
          <div className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center bg-white border border-[#EAE3D2] rounded-2xl shadow-2xl p-4">
            <img
              src={`${API_BASE_URL}/api/graph`}
              alt="Identity Risk Graph Maximize"
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()} // Click guard protection
            />
          </div>

          <div className="mt-4 text-[10px] text-[#A0968A] tracking-wide font-mono pointer-events-none">
            Source: NetworkX Integration API · Click anywhere outside vector canvas to collapse
          </div>
        </div>
      )}

    </div>
  );
}
