import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart, Line } from 'recharts';
import { useAnalyticsMetrics } from '../../hooks/useAnalyticsMetrics';

interface MessageData {
  date: string;
  activeUsers: number;
  totalMessages: number;
  msgsPerUser: number;
}

export function MessagesPerUserChart() {
  const { messagesPerUser: data, loading } = useAnalyticsMetrics();

  const isLoading = loading;

  const average = data.length > 0 
    ? data.reduce((acc, curr) => acc + curr.msgsPerUser, 0) / data.length 
    : 0;

  const chartData = isLoading ? [] : data.map(d => ({
    ...d,
    average: parseFloat(average.toFixed(1))
  }));

  return (
    <div className="glass-panel p-6 h-96 flex flex-col">
      <h3 className="text-lg font-medium text-brand-text mb-6">Messages Per User (7 Days)</h3>
      <div className="flex-1 w-full min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-end gap-2 px-2 pb-8 opacity-20 pointer-events-none">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="shimmer flex-1 rounded-t-lg" style={{ height: `${Math.random() * 60 + 20}%` }} />
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#8E8E93" 
              fontSize={11} 
              tickMargin={10}
              axisLine={false}
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
            <Bar dataKey="msgsPerUser" name="Messages / User" fill="#00b2ff" radius={[4, 4, 0, 0]} barSize={30} />
            <Line type="monotone" dataKey="average" name="7-Day Average" stroke="#3ecf8e" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
