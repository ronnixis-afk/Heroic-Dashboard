import { useEffect, useState } from 'react';
import { Users, Activity, Target, CalendarRange } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { fetchRpgAdmin } from '../../lib/rpgAdminApi';

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
      const json = await fetchRpgAdmin<ActiveUsersData>(
        '/api/admin/analytics/active-users',
        getToken
      );
      if (json && typeof json.activeNow === 'number') {
        setData(json);
        setError(null);
      } else {
        throw new Error('Invalid data format returned by server.');
      }
    } catch (err: unknown) {
      console.error('Failed to fetch active users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch active users.');
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

  const activeNow = data.activeNow || 0;
  const isHighTraffic = activeNow > 0;

  const cells = [
    {
      icon: Activity,
      label: 'Active Right Now',
      value: activeNow,
      suffix: 'users',
      valueClass: isHighTraffic ? 'text-emerald-500' : 'text-brand-text',
    },
    {
      icon: Users,
      label: 'DAU',
      value: data.dau?.toLocaleString() || 0,
      suffix: 'users today',
      valueClass: 'text-brand-text',
    },
    {
      icon: CalendarRange,
      label: 'MAU',
      value: data.mau?.toLocaleString() || 0,
      suffix: 'users in 30 days',
      valueClass: 'text-brand-text',
    },
    {
      icon: Target,
      label: 'Stickiness',
      value: `${data.stickiness || 0}%`,
      suffix: 'DAU / MAU',
      valueClass: 'text-brand-text',
    },
  ];

  return (
    <div className="card p-3.5 grid grid-cols-2 lg:grid-cols-4 gap-0">
      {cells.map((cell, index) => {
        const Icon = cell.icon;
        return (
          <div
            key={cell.label}
            className={`flex flex-col p-3 ${
              index < cells.length - 1 ? 'lg:border-r border-brand-primary' : ''
            } ${index < 2 ? 'border-b lg:border-b-0 border-brand-primary' : ''}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-brand-text-muted" />
              <h4 className="text-xs text-brand-text-muted">{cell.label}</h4>
            </div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className={`card-metric ${cell.valueClass}`}>{cell.value}</span>
              <span className="text-xs text-brand-text-muted">{cell.suffix}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
