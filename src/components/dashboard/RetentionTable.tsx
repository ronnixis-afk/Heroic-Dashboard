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
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchData = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/retention`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const json = await res.json();
      if (json && json.error) {
        throw new Error(json.error);
      }
      if (Array.isArray(json)) {
        setData(json);
        setError(null);
      } else {
        throw new Error('Invalid data format returned by server.');
      }
    } catch (err: any) {
      console.error('Error fetching retention analytics:', err);
      setError(err.message || 'Failed to fetch retention analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getToken]);

  if (loading) {
    return <div className="card p-3.5 h-64 animate-pulse">
      <div className="h-4 w-28 bg-brand-primary rounded mb-3"></div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-8 w-full bg-brand-primary/50 rounded-md"></div>
        ))}
      </div>
    </div>;
  }

  if (error) {
    return (
      <div className="card p-3.5 h-64 flex flex-col justify-center items-center text-center">
        <h3 className="text-title font-semibold text-brand-text mb-3">User Retention</h3>
        <div className="text-xs text-brand-text-muted mb-3 font-medium max-w-xs">
          {error}
        </div>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchData();
          }}
          className="btn-primary btn-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const getHeatmapColor = (percentage: number) => {
    if (percentage >= 40) return 'bg-[#3ecf8e]/40 text-brand-text font-medium';
    if (percentage >= 20) return 'bg-[#3ecf8e]/20 text-brand-text';
    if (percentage > 0) return 'bg-[#3ecf8e]/10 text-brand-text';
    return 'text-brand-text-muted';
  };

  return (
    <div className="card p-3.5 overflow-x-auto">
      <h3 className="card-title mb-3">User Retention</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Cohort</th>
            <th className="text-center">New Users</th>
            <th className="text-center">Day 1</th>
            <th className="text-center">Day 7</th>
            <th className="text-center">Day 30</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              <td className="font-medium">{row.cohort}</td>
              <td className="text-center text-brand-text-muted">{row.newUsers}</td>
              <td className="text-center">
                <div className={`px-2 py-0.5 rounded text-center text-xs ${getHeatmapColor(row.day1Retention)}`}>
                  {row.day1Retention}%
                </div>
              </td>
              <td className="text-center">
                <div className={`px-2 py-0.5 rounded text-center text-xs ${getHeatmapColor(row.day7Retention)}`}>
                  {row.day7Retention}%
                </div>
              </td>
              <td className="text-center">
                <div className={`px-2 py-0.5 rounded text-center text-xs ${getHeatmapColor(row.day30Retention)}`}>
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
