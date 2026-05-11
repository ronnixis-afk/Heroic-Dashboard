import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';
import { SkeletonText } from '../Skeleton';

interface UsageData {
  feature: string;
  totalUses: number;
  percentage: number;
  uniqueUsers: number;
  avgDurationMs: number;
}

export function FeatureUsageChart() {
  const { featureUsage: data, loading } = useAnalyticsMetrics();

  const isLoading = loading;

  const getBarColor = (percentage: number) => {
    if (percentage >= 20) return '#00b2ff'; // Core
    if (percentage >= 5) return '#3ecf8e'; // Secondary
    return '#ff5a36'; // Underused
  };

  return (
    <div className="glass-panel p-6 h-96 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-medium text-brand-text m-0">Feature Usage (30 Days)</h3>
      </div>
      
      <div className="flex-1 w-full min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col gap-3 px-2 py-4 opacity-20 pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer h-5 rounded-md" style={{ width: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isLoading ? [] : data.usage} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
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
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const descriptions: Record<string, string> = {
                    'Response': 'Standard AI dialogue and story narration. Primary interaction method for players.',
                    'World Building': 'Generates new locations, lore, and background details. Helps expand the universe dynamically.',
                    'Quest Log Summary': 'Automatically summarizes recent events into the player journal. Keeps adventure history organized.',
                    'Tactical Brief': 'Internal AI logic that architects encounter layouts and GM notes. Ensures combat remains consistent.',
                    'Scene Generation': 'Creates immersive sensory descriptions of the environment. Focuses on atmosphere and visual details.',
                    'Profile Picture': 'Generates visual portraits for characters and NPCs. Adds a visual layer to the experience.',
                    'Quest Narration': 'Specialized AI updates on quest progression. Acts as the overarching storyteller for the journey.'
                  };
                  const desc = descriptions[data.feature] || 'Miscellaneous AI requests and system prompts.';
                  
                  return (
                    <div className="glass-panel p-4 shadow-2xl border border-brand-primary/50 w-[280px] pointer-events-none">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-bold text-brand-text m-0">{data.feature}</p>
                        <p className="text-xs font-bold text-emerald-400 m-0">${data.totalCost.toFixed(2)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-lg font-bold text-white m-0">{data.percentage}%</p>
                          <p className="text-[10px] text-brand-text-muted m-0 uppercase tracking-wider">of total usage</p>
                        </div>
                        <p className="text-[10px] leading-relaxed text-brand-text-muted italic border-t border-brand-primary/20 pt-2 block whitespace-normal">
                          {desc}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={20}>
              {!isLoading && data.usage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
