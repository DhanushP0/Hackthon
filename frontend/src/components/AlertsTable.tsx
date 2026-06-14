// src/components/AlertsTable.tsx
import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react';
import type { RiskAccount } from '../types';

interface AlertsTableProps {
  accounts: RiskAccount[];
}

type SortOrder = 'asc' | 'desc' | 'none';

export default function AlertsTable({ accounts }: AlertsTableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Default to high-risk first

  // Handle toggling the risk score sort order
  const toggleSort = () => {
    if (sortOrder === 'none') setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder('none');
  };

  // Sort logic applied to accounts mapping
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortOrder === 'asc') return a.risk_score - b.risk_score;
    if (sortOrder === 'desc') return b.risk_score - a.risk_score;
    return 0; // 'none' returns raw structural layout index order
  });

  // Proxy layout helper for mock "Days Inactive" metric field mapping
  const getDaysInactivePlaceholder = (score: number) => {
    return Math.floor((score * 1.4) % 90) + 2; 
  };

  // Helper for rendering clean text matching severity badges
  const getSeverityStyles = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#FFF5F5] text-[#C53030] border-[#FEB2B2]';
      case 'HIGH':
        return 'bg-[#FFFAF0] text-[#DD6B20] border-[#FEEBC8]';
      case 'MEDIUM':
        return 'bg-[#FFFDF5] text-[#D69E2E] border-[#FEEBC8]';
      default:
        return 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]';
    }
  };

  return (
    <div className="bg-white border border-[#EAE3D2] rounded-xl overflow-hidden shadow-sm flex flex-col w-full">
      
      {/* Table Header Row Control Bar */}
      <div className="p-4 border-b border-[#EAE3D2] bg-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={14} className="text-[#7C7267]" />
          <h3 className="text-xs font-bold uppercase text-[#7C7267] tracking-wider">Identity Risk Inventory</h3>
        </div>
        <div className="text-[10px] text-[#7C7267] font-semibold bg-[#FDFBF7] border border-[#EAE3D2] px-2.5 py-1 rounded-md">
          {sortedAccounts.length} targets identified
        </div>
      </div>

      {/* Main Table Structure */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#EAE3D2] text-[10px] uppercase tracking-wider text-[#7C7267] font-bold bg-[#FDFBF7] select-none">
              <th className="py-3 px-4 font-bold">User</th>
              <th className="py-3 px-4 font-bold">Department</th>
              <th className="py-3 px-4 font-bold">Privilege</th>
              <th className="py-3 px-4 font-bold text-center">Days Inactive</th>
              
              {/* Sortable Header Column */}
              <th className="py-3 px-4 cursor-pointer hover:bg-[#EAE3D2]/30 transition-colors" onClick={toggleSort}>
                <div className="flex items-center justify-center space-x-1 mx-auto w-max">
                  <span>Score</span>
                  {sortOrder === 'none' && <ArrowUpDown size={12} className="text-[#A0968A]" />}
                  {sortOrder === 'asc' && <ArrowUp size={12} className="text-[#4F46E5]" />}
                  {sortOrder === 'desc' && <ArrowDown size={12} className="text-[#4F46E5]" />}
                </div>
              </th>
              
              <th className="py-3 px-4 font-bold text-right">Severity</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-[#EAE3D2]/60 text-xs text-[#2C2520]">
            {sortedAccounts.map((account) => {
              const daysInactive = getDaysInactivePlaceholder(account.risk_score);
              
              return (
                <tr key={account.user_id} className="hover:bg-[#FDFBF7] transition-colors group">
                  
                  {/* Column 1: User Profile identity badge info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-[#EAE3D2] border border-[#DCD6CD] flex items-center justify-center font-bold text-[10px] text-[#1E293B] uppercase group-hover:bg-[#4F46E5] group-hover:text-white group-hover:border-[#4F46E5] transition-all">
                        {account.username.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E293B] tracking-tight">{account.username}</p>
                        <p className="text-[10px] text-[#7C7267] font-mono">{account.user_id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Department Segment line */}
                  <td className="py-3.5 px-4 text-[#7C7267] font-medium">
                    {account.department}
                  </td>

                  {/* Column 3: Privilege classification tags */}
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                      account.role_title.toLowerCase().includes('admin') || account.risk_score > 85
                        ? 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]' 
                        : 'bg-[#F7FAFC] text-[#4A5568] border-[#E2E8F0]'
                    }`}>
                      {account.role_title}
                    </span>
                  </td>

                  {/* Column 4: Days Inactive tracking value */}
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-[#7C7267]">
                    {daysInactive}d
                  </td>

                  {/* Column 5: Risk Score Metrics display element */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-sm">
                    <span className={
                      account.risk_score >= 80 ? 'text-[#C53030]' : 
                      account.risk_score >= 50 ? 'text-[#DD6B20]' : 'text-[#2F855A]'
                    }>
                      {account.risk_score}
                    </span>
                  </td>

                  {/* Column 6: Severity Badge item frame container */}
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getSeverityStyles(account.risk_level)}`}>
                      {account.risk_level.toLowerCase()}
                    </span>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
