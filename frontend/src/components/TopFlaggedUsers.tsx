// src/components/TopFlaggedUsers.tsx
import { ChevronRight } from 'lucide-react';
import { BUILT_IN_MOCK_ACCOUNTS } from '../mockData';

export default function TopFlaggedUsers() {
  const flaggedUsers = BUILT_IN_MOCK_ACCOUNTS.slice(0, 4); // Use the top 4 risky users

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Top Flagged Users</h2>
        <button type="button" className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          View All -&gt;
        </button>
      </div>

      {/* List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
        {flaggedUsers.map((user) => (
          <div key={user.user_id} className="w-full text-left p-4 flex items-center justify-between group hover:bg-slate-800/40 transition-colors">
            <div className="flex items-center space-x-3.5 truncate">
              {/* Fake Avatar */}
              <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-sm text-slate-300 select-none">
                {user.username.split('.').map(name => name[0].toUpperCase()).join('')}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.username}</p>
                <p className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
                  {user.role_title} • {user.department}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 shrink-0 pl-2">
              {/* Finding Tag */}
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                user.risk_level === 'CRITICAL' ? 'bg-red-950/40 text-red-400 border-red-900/50' :
                user.risk_level === 'HIGH' ? 'bg-orange-950/40 text-orange-400 border-orange-900/50' : 'bg-slate-800/40 text-slate-400 border-slate-700'
              }`}>
                {user.findings[0].finding.split('_').slice(0, 1).join(' ')} + ...
              </span>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
