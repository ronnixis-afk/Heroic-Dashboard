import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';

interface SessionDaily {
  date: string;
  totalSessions: number;
  avgDurationMin: number;
  medianDurationMin: number;
  p95DurationMin: number;
}

interface SessionDistribution {
  range: string;
  count: number;
  percentage: number;
}

export function SessionLengthChart() {
  const { sessionLengths: data, loading } = useAnalyticsMetrics();

  const isLoading = loading || !data;

  return (
    <div className="glass-panel p-6 h-[500px] flex flex-col">
      <h3 className="text-lg font-medium text-brand-text mb-6">Session Lengths (30 Days)</h3>
      
      <div className="flex-1 w-full min-h-0 mb-6 relative">
        <h4 className="text-sm font-medium text-brand-text-muted mb-2">Trend (Minutes)</h4>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-1 px-2 pb-8 opacity-10 pointer-events-none mt-6">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="shimmer flex-1 rounded-t-sm" style={{ height: `${Math.random() * 50 + 20}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={isLoading ? [] : data.daily} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3ecf8e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3ecf8e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#8E8E93" 
              fontSize={11} 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => {
                if (!val) return '';
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
            />
            <Area type="monotone" dataKey="p95DurationMin" name="95th Percentile" stroke="#ff5a36" fillOpacity={0} strokeWidth={1} strokeDasharray="3 3" />
            <Area type="monotone" dataKey="avgDurationMin" name="Average" stroke="#3ecf8e" fill="url(#colorAvg)" strokeWidth={2} />
            <Area type="monotone" dataKey="medianDurationMin" name="Median" stroke="#20cce0" fillOpacity={0} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="h-32 w-full mt-4 border-t border-[#292a32] pt-4 relative">
        <h4 className="text-sm font-medium text-brand-text-muted mb-2">Distribution</h4>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-2 px-4 pb-4 opacity-20 pointer-events-none mt-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shimmer flex-1 rounded-t-lg" style={{ height: `${Math.random() * 80 + 10}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={isLoading ? [] : data.distribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="range" stroke="#8E8E93" fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', border: '1px solid #292a32', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '4px', fontWeight: 'medium', fontSize: '10px' }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar dataKey="percentage" name="% of Sessions" radius={[2, 2, 0, 0]}>
              {!isLoading && data.distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="#20cce0" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
