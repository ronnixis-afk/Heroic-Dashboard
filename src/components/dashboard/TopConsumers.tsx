import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TopConsumersProps {
  topConsumers: any[];
}

export default function TopConsumers({ topConsumers }: TopConsumersProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-panel p-6 h-[340px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Top Consumers</h3>
        <button 
          onClick={() => navigate('/admin/analytics')}
          className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors"
        >
          View All
        </button>
      </div>
      
      <div className="flex items-center text-[11px] font-medium text-[#8b8c94] mb-4 pb-2 border-b border-[#292a32] px-2">
        <span className="flex-1">Customer</span>
        <span className="w-24 text-center">Top Model</span>
        <span className="w-20 text-right">Spend</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {topConsumers.map((tx, idx) => (
          <div key={tx.id} className={`flex items-center p-2 rounded-xl transition-colors ${idx === 1 ? 'bg-[#292a32]' : 'hover:bg-[#292a32]'}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-[#292a32] shrink-0">
                <img src={tx.icon} alt={tx.user} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-medium text-[#e2e2e2] truncate" title={tx.user}>{tx.user}</span>
            </div>
            <span className="text-[11px] text-[#8b8c94] w-24 text-center shrink-0">{tx.model}</span>
            <span className="text-xs font-bold text-emerald-400 w-20 text-right shrink-0">${tx.cost.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
