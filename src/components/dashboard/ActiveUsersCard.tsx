import { useEffect, useState } from 'react';
import { Users, Activity, Target } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface ActiveUsersData {
  activeNow: number;
  dau: number;
  mau: number;
  stickiness: number;
}

export function ActiveUsersCard() {
  const [data, setData] = useState<ActiveUsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchData = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/active-users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const json = await response.json();
      if (json && json.error) {
        throw new Error(json.error);
      }
      if (json && typeof json.activeNow === 'number') {
        setData(json);
        setError(null);
      } else {
        throw new Error('Invalid data format returned by server.');
      }
    } catch (err: any) {
      console.error('Failed to fetch active users:', err);
      setError(err.message || 'Failed to fetch active users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [getToken]);

  if (loading) {
    return (
      <div className="card p-3.5 animate-pulse flex flex-col">
        <div className="h-4 w-24 bg-brand-primary rounded mb-2" />
        <div className="h-5 w-16 bg-brand-primary rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-3.5 flex flex-col justify-center items-center text-center">
        <p className="text-xs text-brand-text-muted mb-2">{error || 'Failed to load active users.'}</p>
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

  const activeNow = data?.activeNow || 0;
  const isHighTraffic = activeNow > 0;

  return (
    <div className="card p-3.5 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex flex-col border-b md:border-b-0 md:border-r border-brand-primary pb-3 md:pb-0 md:pr-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Activity className="w-3.5 h-3.5 text-brand-text-muted" />
          <h4 className="text-xs text-brand-text-muted">Active Right Now</h4>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`card-metric ${isHighTraffic ? 'text-emerald-500' : 'text-brand-text'}`}
          >
            {activeNow}
          </span>
          <span className="text-xs text-brand-text-muted">users</span>
        </div>
      </div>

      <div className="flex flex-col border-b md:border-b-0 md:border-r border-brand-primary pb-3 md:pb-0 md:pr-3 md:pl-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Users className="w-3.5 h-3.5 text-brand-text-muted" />
          <h4 className="text-xs text-brand-text-muted">DAU</h4>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="card-metric">{data?.dau?.toLocaleString() || 0}</span>
          <span className="text-xs text-brand-text-muted">users today</span>
        </div>
      </div>

      <div className="flex flex-col md:pl-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Target className="w-3.5 h-3.5 text-brand-text-muted" />
          <h4 className="text-xs text-brand-text-muted">Stickiness</h4>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="card-metric">{data?.stickiness || 0}%</span>
          <span className="text-xs text-brand-text-muted">DAU / MAU</span>
        </div>
      </div>
    </div>
  );
}
