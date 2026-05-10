import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface MessageData {
  date: string;
  activeUsers: number;
  totalMessages: number;
  msgsPerUser: number;
}

export function MessagesPerUserChart() {
  const [data, setData] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/messages-per-user?days=7`, {
      headers: { 'x-admin-key': import.meta.env.VITE_ADMIN_API_KEY }
    })
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          setData(json.reverse());
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="glass-panel p-6 h-80 animate-pulse flex flex-col justify-between">
      <div className="h-6 w-48 bg-[#292a32] rounded mb-4"></div>
      <div className="h-full w-full bg-[#292a32]/50 rounded"></div>
    </div>;
  }

  const average = data.length > 0 
    ? data.reduce((acc, curr) => acc + curr.msgsPerUser, 0) / data.length 
    : 0;

  const chartData = data.map(d => ({
    ...d,
    average: parseFloat(average.toFixed(1))
  }));

  return (
    <div className="glass-panel p-6 h-96 flex flex-col">
      <h3 className="text-lg font-medium text-brand-text mb-6">Messages Per User (7 Days)</h3>
      <div className="flex-1 w-full min-h-0">
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
                const d = new Date(val);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis stroke="#8E8E93" fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1d1e24', borderColor: '#292a32', borderRadius: '8px' }}
              itemStyle={{ color: '#ffffff' }}
              labelStyle={{ color: '#8b8c94', marginBottom: '4px' }}
            />
            <Bar dataKey="msgsPerUser" name="Msgs / User" fill="#00b2ff" radius={[4, 4, 0, 0]} barSize={30} />
            <Line type="monotone" dataKey="average" name="7-Day Avg" stroke="#3ecf8e" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
