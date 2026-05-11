import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';

interface RetentionData {
  cohort: string;
  newUsers: number;
  day1Retention: number;
  day7Retention: number;
  day30Retention: number;
}

export function RetentionTable() {
  const [data, setData] = useState<RetentionData[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken({ template: 'supabase' });
        const res = await fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/retention`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json);
        }
      } catch (error) {
        console.error('Error fetching retention analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  if (loading) {
    return <div className="glass-panel p-6 h-80 animate-pulse">
      <div className="h-6 w-32 bg-[#292a32] rounded mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-10 w-full bg-[#292a32]/50 rounded"></div>
        ))}
      </div>
    </div>;
  }

  const getHeatmapColor = (percentage: number) => {
    if (percentage >= 40) return 'bg-[#3ecf8e]/40 text-brand-text font-medium';
    if (percentage >= 20) return 'bg-[#3ecf8e]/20 text-brand-text';
    if (percentage > 0) return 'bg-[#3ecf8e]/10 text-brand-text';
    return 'text-[#8b8c94]';
  };

  return (
    <div className="glass-panel p-6 overflow-x-auto">
      <h3 className="text-lg font-medium text-brand-text mb-6">User Retention</h3>
      <table className="w-full text-left data-table">
        <thead>
          <tr className="border-b border-[#292a32]">
            <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94]">Cohort</th>
            <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94]">New Users</th>
            <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94]">Day 1</th>
            <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94]">Day 7</th>
            <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94]">Day 30</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b border-brand-primary/10 last:border-0 hover:bg-white/5 transition-colors">
              <td className="py-3 px-2 font-medium text-brand-text">{row.cohort}</td>
              <td className="py-3 px-2 text-brand-text-muted">{row.newUsers}</td>
              <td className="py-3 px-2">
                <div className={`px-2 py-1 rounded text-center ${getHeatmapColor(row.day1Retention)}`}>
                  {row.day1Retention}%
                </div>
              </td>
              <td className="py-3 px-2">
                <div className={`px-2 py-1 rounded text-center ${getHeatmapColor(row.day7Retention)}`}>
                  {row.day7Retention}%
                </div>
              </td>
              <td className="py-3 px-2">
                <div className={`px-2 py-1 rounded text-center ${getHeatmapColor(row.day30Retention)}`}>
                  {row.day30Retention}%
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
