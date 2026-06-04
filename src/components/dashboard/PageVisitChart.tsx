import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';

interface PageVisitData {
  page: string;
  visits: number;
  percentage: number;
  uniqueUsers: number;
}

/** Human-readable labels for page keys */
const PAGE_LABELS: Record<string, string> = {
  'character': 'Heroes',
  'inventory': 'Backpack',
  'chat': 'Play',
  'knowledge': 'Map',
  'menu-open': 'Menu',
  'story': 'Chronicle',
  'objectives': 'Quests',
  'world': 'Lore',
  'npcs': 'People',
  'store': 'Merchant',
  'recruit': 'Recruit',
  'gm-notes': 'Gm Notes',
  'item-forge': 'Forge',
  'temp-stats': 'Scene',
  'gallery': 'Gallery',
  'rest-camp': 'Rest & Camp',
  'settings': 'Settings',
  'exit-realm': 'Exit Realm',
  'room-navigation': 'Room Navigation',
  'zone-details': 'Zone Details',
};

function toTitleCase(str: string): string {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function PageVisitChart() {
  const { pageVisitUsage: data, loading } = useAnalyticsMetrics();

  const getBarColor = (percentage: number) => {
    if (percentage >= 25) return '#00e5ff'; // Primary
    if (percentage >= 10) return '#3ecf8e'; // Secondary
    if (percentage >= 5) return '#a855f7';  // Moderate
    return '#8b8c94';                       // Low usage
  };

  return (
    <div className="glass-panel p-6 h-96 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-medium text-brand-text m-0">Page Visits (30 Days)</h3>
      </div>
      
      <div className="flex-1 w-full min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col gap-3 px-2 py-4 opacity-20 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer h-4 rounded-md" style={{ width: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={loading ? [] : data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" horizontal={false} />
            <XAxis type="number" stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
            <YAxis 
              dataKey="page" 
              type="category" 
              stroke="#8E8E93" 
              fontSize={11} 
              axisLine={false} 
              tickLine={false}
              width={110}
              interval={0}
              tickFormatter={(val) => PAGE_LABELS[val] || toTitleCase(val)}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload as PageVisitData;
                  const label = PAGE_LABELS[entry.page] || toTitleCase(entry.page);
                  
                  return (
                    <div className="tooltip-panel pointer-events-none w-[240px]">
                        <p className="text-xs font-bold text-white m-0 mb-3">{label}</p>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-medium text-brand-text-muted">Total Visits</span>
                            <span className="text-xs font-bold text-white">{entry.visits.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-medium text-brand-text-muted">Usage Share</span>
                            <span className="text-xs font-bold text-brand-accent">{entry.percentage}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-medium text-brand-text-muted">Unique Users</span>
                            <span className="text-xs font-bold text-purple-400">{entry.uniqueUsers}</span>
                          </div>
                        </div>
                      </div>
                    );
                }
                return null;
              }}
            />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
              {!loading && data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(data[index]?.percentage || 0)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
