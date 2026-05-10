import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UsageData {
  feature: string;
  totalUses: number;
  percentage: number;
  uniqueUsers: number;
  avgDurationMs: number;
}

export function FeatureUsageChart() {
  const [data, setData] = useState<{ usage: UsageData[], chatOnlyUsers: number }>({ usage: [], chatOnlyUsers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/feature-usage`, {
      headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY }
    })
      .then(res => res.json())
      .then(json => {
        setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="glass-panel p-6 h-96 animate-pulse flex flex-col justify-between">
      <div className="h-6 w-48 bg-[#292a32] rounded mb-4"></div>
      <div className="h-full w-full bg-[#292a32]/50 rounded"></div>
    </div>;
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 20) return '#00b2ff'; // Core
    if (percentage >= 5) return '#3ecf8e'; // Secondary
    return '#ff5a36'; // Underused
  };

  return (
    <div className="glass-panel p-6 h-96 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-medium text-brand-text m-0">Feature Usage (30 Days)</h3>
        <div className="text-right">
          <p className="text-xs text-brand-text-muted m-0">Chat-Only Users</p>
          <p className="text-sm font-bold text-brand-text m-0">{data.chatOnlyUsers}</p>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.usage} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" horizontal={false} />
            <XAxis type="number" stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
            <YAxis 
              dataKey="feature" 
              type="category" 
              stroke="#8E8E93" 
              fontSize={11} 
              axisLine={false} 
              tickLine={false}
              width={100}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', borderColor: '#292a32', borderRadius: '8px' }}
              itemStyle={{ color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '4px' }}
              formatter={(value: any, name: any) => {
                if (name === 'percentage') return [`${value}%`, 'Share'];
                return [value, name];
              }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={20}>
              {data.usage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
