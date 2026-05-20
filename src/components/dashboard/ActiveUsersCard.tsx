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
      const response = await fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/active-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    const interval = setInterval(fetchData, 60000); // 60s auto-refresh
    return () => clearInterval(interval);
  }, [getToken]);

  if (loading) {
    return (
      <div className="glass-panel p-6 animate-pulse flex flex-col">
        <div className="h-6 w-32 bg-[#292a32] rounded mb-4"></div>
        <div className="h-12 w-24 bg-[#292a32] rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-6 flex flex-col justify-center items-center text-center">
        <div className="text-brand-text-muted mb-3 text-sm font-medium">
          {error || 'Failed to load active users.'}
        </div>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchData();
          }}
          className="btn-primary px-3 py-1.5 text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const activeNow = data?.activeNow || 0;
  const isHighTraffic = activeNow > 0;

  return (
    <div className="glass-panel p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="flex flex-col border-b md:border-b-0 md:border-r border-[#292a32] pb-4 md:pb-0 md:pr-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-brand-text-muted" />
          <h4 className="text-sm font-medium text-brand-text-muted m-0">Active Right Now</h4>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-bold ${isHighTraffic ? 'text-emerald-500' : 'text-brand-text'}`}>
            {activeNow}
          </span>
          <span className="text-xs text-brand-text-muted">users</span>
        </div>
      </div>

      <div className="flex flex-col border-b md:border-b-0 md:border-r border-brand-primary/20 pb-4 md:pb-0 md:pr-4 md:pl-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-brand-text-muted" />
          <h4 className="text-sm font-medium text-brand-text-muted m-0">DAU</h4>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-brand-text">
            {data?.dau?.toLocaleString() || 0}
          </span>
          <span className="text-xs text-brand-text-muted">users today</span>
        </div>
      </div>

      <div className="flex flex-col md:pl-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-brand-text-muted" />
          <h4 className="text-sm font-medium text-brand-text-muted m-0">Stickiness</h4>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-brand-text">
            {data?.stickiness || 0}%
          </span>
          <span className="text-xs text-brand-text-muted">DAU / MAU</span>
        </div>
      </div>
    </div>
  );
}
