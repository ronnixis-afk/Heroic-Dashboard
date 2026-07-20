import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCostAnalytics } from '../../hooks/useCostAnalytics';
import { StatusBanner } from '../ui';
import { SkeletonText } from '../Skeleton';

export function CostAnalyticsCard() {
  const {
    modelCostData: byModel = [],
    dailyCostData: daily = [],
    loading,
    error,
    degradedMessage,
  } = useCostAnalytics();

  const isLoading = loading;
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const today =
    daily.find((row) => String(row.date).slice(0, 10) === todayKey) ||
    { totalCost: 0, costPerUser: 0 };
  const totalCost30d = byModel?.reduce((acc, m) => acc + m.totalCost, 0) || 0;
  const totalCalls30d = byModel?.reduce((acc, m) => acc + m.calls, 0) || 0;
  const costPerMessage = totalCalls30d > 0 ? totalCost30d / totalCalls30d : 0;

  return (
    <div className="card p-3.5">
      <h3 className="card-title mb-3">API Cost Distribution</h3>
      {error && (
        <StatusBanner
          type="error"
          message={
            error instanceof Error
              ? error.message
              : 'Unable To Load Cost Analytics From The RPG API.'
          }
        />
      )}
      {!error && degradedMessage && (
        <StatusBanner type="info" message={degradedMessage} />
      )}
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
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0].payload as {
                  model?: string;
                  totalCost?: number;
                  calls?: number;
                  avgLatencyMs?: number;
                };
                return (
                  <div className="tooltip-panel pointer-events-none min-w-[160px]">
                    <p className="text-xs font-semibold text-white m-0 mb-2">{item.model}</p>
                    <div className="space-y-1 text-xs text-brand-text-muted">
                      <div className="flex justify-between gap-4">
                        <span>Total Cost</span>
                        <span className="text-brand-text font-medium">
                          ${Number(item.totalCost || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Calls</span>
                        <span className="text-brand-text font-medium">
                          {Number(item.calls || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Avg Latency</span>
                        <span className="text-brand-text font-medium">
                          {Number(item.avgLatencyMs || 0).toLocaleString()}ms
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="totalCost" fill="#20cce0" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
