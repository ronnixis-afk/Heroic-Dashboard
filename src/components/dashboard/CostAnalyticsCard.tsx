import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CostDaily {
  date: string;
  activeUsers: number;
  totalCost: number;
  costPerUser: number;
}

interface CostByModel {
  model: string;
  calls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgLatencyMs: number;
}

export function CostAnalyticsCard() {
  const [data, setData] = useState<{ daily: CostDaily[], byModel: CostByModel[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/cost-analytics?days=30`, {
      headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY }
    })
      .then(res => res.json())
      .then(json => {
        setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="glass-panel p-6 animate-pulse">
      <div className="h-24 w-full bg-[#292a32] rounded mb-6"></div>
      <div className="h-64 w-full bg-[#292a32]/50 rounded"></div>
    </div>;
  }

  const today = data.daily[0] || { totalCost: 0, costPerUser: 0 };
  const totalCost30d = data.byModel.reduce((acc, m) => acc + m.totalCost, 0);
  const totalCalls30d = data.byModel.reduce((acc, m) => acc + m.calls, 0);
  const costPerMessage = totalCalls30d > 0 ? totalCost30d / totalCalls30d : 0;

  return (
    <div className="glass-panel p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Today's Cost</h4>
          <div className="text-3xl font-bold text-brand-text">${today.totalCost.toFixed(2)}</div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Cost Per User (Today)</h4>
          <div className="text-3xl font-bold text-brand-text">${today.costPerUser.toFixed(4)}</div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Avg Cost Per Call</h4>
          <div className="text-3xl font-bold text-brand-text">${costPerMessage.toFixed(5)}</div>
        </div>
      </div>

      <div className="h-72">
        <h3 className="text-lg font-medium text-brand-text mb-4">Cost by Model (30 Days)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byModel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
            <XAxis dataKey="model" stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} tickFormatter={val => `$${val}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', borderColor: '#292a32', borderRadius: '8px' }}
              itemStyle={{ color: '#ffffff' }}
              formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Total Cost']}
            />
            <Bar dataKey="totalCost" fill="#00b2ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
