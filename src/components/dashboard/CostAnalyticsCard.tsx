/**
 * COST ANALYTICS CARD
 * 
 * Displays detailed API cost distribution and daily trends.
 * 
 * DATA SOURCE:
 * This component consumes processed data from 'useAnalyticsMetrics'.
 */
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import { SkeletonText } from '../Skeleton';

export function CostAnalyticsCard() {
  const { modelCostData: byModel = [], dailyCostData: daily = [], loading } = useAnalyticsMetrics();

  const isLoading = loading;
  const today = daily?.[0] || { totalCost: 0, costPerUser: 0 };
  const totalCost30d = byModel?.reduce((acc, m) => acc + m.totalCost, 0) || 0;
  const totalCalls30d = byModel?.reduce((acc, m) => acc + m.calls, 0) || 0;
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
            <div className="text-3xl font-bold text-brand-text">${today.costPerUser.toFixed(2)}</div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium text-brand-text-muted mb-1">Avg Cost Per Call</h4>
          {isLoading ? (
            <SkeletonText width={120} className="h-9 mt-1" />
          ) : (
            <div className="text-3xl font-bold text-brand-text">${costPerMessage.toFixed(2)}</div>
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
          <BarChart data={isLoading ? [] : byModel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
            <XAxis dataKey="model" stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} tickFormatter={val => `$${Number(val).toFixed(2)}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
              formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Total Cost']}
            />
            <Bar dataKey="totalCost" fill="#00e5ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
