import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  Response: 'Standard AI dialogue and story narration. Primary interaction method for players.',
  'World Building': 'World Creation Wizard, zones, POIs, and location lore generation.',
  'Quest Log Summary': 'Automatically summarizes recent events into the player journal.',
  'Tactical Brief': 'Internal AI logic that architects encounter layouts and GM notes.',
  'Scene Generation': 'Creates immersive sensory descriptions of the environment.',
  'Profile Picture': 'Generates visual portraits for player characters.',
  'Actor Portrait': 'Generates portraits for nearby actors and NPCs via the portrait queue.',
  'Quest Narration': 'Specialized AI updates on quest progression.',
  Transcription: 'Voice-to-text used for spoken player actions.',
};

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function FeatureUsageChart() {
  const { featureUsage: data, loading } = useAnalyticsMetrics();

  const isLoading = loading;

  const getBarColor = (percentage: number) => {
    if (percentage >= 20) return '#20cce0';
    if (percentage >= 5) return '#3ecf8e';
    return '#ff5a36';
  };

  return (
    <div className="card p-3.5 h-80 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="card-title">Feature Adoption (30 Days)</h3>
        {!isLoading && data.chatOnlyUsers > 0 && (
          <span className="help-text shrink-0">{data.chatOnlyUsers.toLocaleString()} Chat-Only</span>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col gap-2 px-2 py-4 opacity-20 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer h-4 rounded-md" style={{ width: `${40 + i * 8}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={isLoading ? [] : data.usage}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" horizontal={false} />
            <XAxis
              type="number"
              stroke="#8E8E93"
              fontSize={10}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => `${val}%`}
            />
            <YAxis
              dataKey="feature"
              type="category"
              stroke="#8E8E93"
              fontSize={10}
              axisLine={false}
              tickLine={false}
              width={96}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const desc =
                    FEATURE_DESCRIPTIONS[item.feature] ||
                    'Miscellaneous AI requests and system prompts.';

                  return (
                    <div className="tooltip-panel pointer-events-none min-w-[220px]">
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <p className="text-xs font-semibold text-white m-0">{item.feature}</p>
                        {item.totalCost > 0 && (
                          <p className="text-xs font-semibold text-emerald-400 m-0">
                            ${item.totalCost.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <p className="card-metric m-0">{item.percentage}%</p>
                          <p className="text-xs text-brand-text-muted m-0">Of Total Usage</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                          <div>
                            <p className="m-0 help-text">Uses</p>
                            <p className="m-0 text-brand-text font-medium">
                              {(item.totalUses || 0).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="m-0 help-text">Unique Users</p>
                            <p className="m-0 text-brand-text font-medium">
                              {(item.uniqueUsers || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="m-0 help-text">Avg Duration</p>
                            <p className="m-0 text-brand-text font-medium">
                              {formatDuration(item.avgDurationMs || 0)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed text-brand-text-muted italic border-t border-brand-primary/20 pt-2 block whitespace-normal m-0">
                          {desc}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
              {!isLoading &&
                data.usage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
