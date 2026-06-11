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
    <div className="card p-3.5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <h4 className="text-xs text-brand-text-muted mb-0.5">Today's Cost</h4>
          {isLoading ? (
            <SkeletonText width={80} className="h-5 mt-1" />
          ) : (
            <div className="card-metric">${today.totalCost.toFixed(2)}</div>
          )}
        </div>
        <div>
          <h4 className="text-xs text-brand-text-muted mb-0.5">Cost Per User (Today)</h4>
          {isLoading ? (
            <SkeletonText width={80} className="h-5 mt-1" />
          ) : (
            <div className="card-metric">${today.costPerUser.toFixed(2)}</div>
          )}
        </div>
        <div>
          <h4 className="text-xs text-brand-text-muted mb-0.5">Avg Cost Per Call</h4>
          {isLoading ? (
            <SkeletonText width={80} className="h-5 mt-1" />
          ) : (
            <div className="card-metric">${costPerMessage.toFixed(2)}</div>
          )}
        </div>
      </div>

      <div className="h-52 relative">
        <h3 className="section-title mb-2">Cost by Model (30 Days)</h3>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-2 px-2 pb-6 opacity-20 pointer-events-none mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shimmer flex-1 rounded-t"
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isLoading ? [] : byModel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
            <XAxis dataKey="model" stroke="#8E8E93" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis
              stroke="#8E8E93"
              fontSize={10}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1b20',
                border: '1px solid #292a32',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '2px', fontSize: '10px' }}
              formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Total Cost']}
            />
            <Bar dataKey="totalCost" fill="#20cce0" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
