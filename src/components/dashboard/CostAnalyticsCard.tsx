import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../lib/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { SkeletonText } from '../Skeleton';

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
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken({ template: 'supabase' });
        const supabase = getSupabaseClient(token || undefined);
        
        // Fetch daily metrics for cost-per-user
        const { data: daily } = await supabase.from('daily_usage_summary').select('*').order('date', { ascending: false }).limit(30);
        
        // Fetch model distribution
        const { data: byModel } = await supabase.from('model_usage_distribution').select('*');
        
        setData({
          daily: (daily || []).map(m => ({
            date: m.date,
            activeUsers: m.active_users || 0,
            totalCost: Number(m.total_cost) || 0,
            costPerUser: m.active_users > 0 ? (m.total_cost / m.active_users) : 0
          })),
          byModel: (byModel || []).map(m => ({
            model: m.model,
            calls: m.usage_count || 0,
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCost: Number(m.total_cost) || 0,
            avgLatencyMs: 0
          }))
        });
      } catch (error) {
        console.error('Error fetching cost analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [getToken]);

  const isLoading = loading || !data;
  const today = data?.daily?.[0] || { totalCost: 0, costPerUser: 0 };
  const totalCost30d = data?.byModel?.reduce((acc, m) => acc + m.totalCost, 0) || 0;
  const totalCalls30d = data?.byModel?.reduce((acc, m) => acc + m.calls, 0) || 0;
  const costPerMessage = totalCalls30d > 0 ? totalCost30d / totalCalls30d : 0;

  return (
    <div className="glass-panel p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Today's Cost</h4>
          {isLoading ? (
            <SkeletonText width={120} className="h-9 mt-1" />
          ) : (
            <div className="text-3xl font-bold text-brand-text">${today.totalCost.toFixed(2)}</div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Cost Per User (Today)</h4>
          {isLoading ? (
            <SkeletonText width={120} className="h-9 mt-1" />
          ) : (
            <div className="text-3xl font-bold text-brand-text">${today.costPerUser.toFixed(4)}</div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Avg Cost Per Call</h4>
          {isLoading ? (
            <SkeletonText width={120} className="h-9 mt-1" />
          ) : (
            <div className="text-3xl font-bold text-brand-text">${costPerMessage.toFixed(5)}</div>
          )}
        </div>
      </div>

      <div className="h-72 relative">
        <h3 className="text-lg font-medium text-brand-text mb-4">Cost by Model (30 Days)</h3>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-3 px-2 pb-8 opacity-20 pointer-events-none mt-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isLoading ? [] : data?.byModel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
