import React from 'react';

export type StatusType = 
  | 'enabled' 
  | 'disabled' 
  | 'pending' 
  | 'completed' 
  | 'cancelled'
  | 'running'
  | 'buy'
  | 'sell'
  | 'win'
  | 'lose'
  | 'market'
  | 'limit'
  | 'higher'
  | 'lower';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const STATUS_STYLES: Record<StatusType, string> = {
  enabled: 'bg-green-500/10 text-green-400 border-green-500/20',
  disabled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  running: 'bg-[#4CF4A5]/10 text-[#4CF4A5] border-[#4CF4A5]/20',
  buy: 'bg-green-500/10 text-green-400 border-green-500/20',
  sell: 'bg-red-500/10 text-red-400 border-red-500/20',
  win: 'bg-green-500/10 text-green-400 border-green-500/20',
  lose: 'bg-red-500/10 text-red-400 border-red-500/20',
  market: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  limit: 'bg-[#4CF4A5]/10 text-[#4CF4A5] border-[#4CF4A5]/20',
  higher: 'bg-green-500/10 text-green-400 border-green-500/20',
  lower: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}
    >
      {displayLabel}
    </span>
  );
};
