import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { fetchRpgAdmin } from '../../lib/rpgAdminApi';

interface AtRiskUser {
  id: string;
  email: string;
  tier: string;
  totalSessions: number;
  lastSession: string | null;
  daysSinceLastSession: number | null;
  sessionsLast3Days: number;
  sessionsLast7Days: number;
  msgsLast7Days: number;
  churnScore: number;
}

interface ChurnSummary {
  totalAtRisk: number;
  newThisWeek: number;
  resolvedThisWeek: number;
}

export function ChurnSignalsTable() {
  const [data, setData] = useState<{ atRiskUsers: AtRiskUser[], summary: ChurnSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const fetchData = async () => {
    try {
      const json = await fetchRpgAdmin<{ atRiskUsers: AtRiskUser[]; summary: ChurnSummary }>(
        '/api/admin/analytics/churn-signals',
        getToken
      );
      if (!json || !json.summary || !json.atRiskUsers) {
        throw new Error('Invalid data format returned by server.');
      }
      setData(json);
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching churn signals analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch churn signals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [getToken]);

  if (loading) {
    return <div className="card p-3.5 h-80 animate-pulse flex flex-col">
      <div className="h-4 w-36 bg-brand-primary rounded mb-3"></div>
      <div className="flex gap-3 mb-4">
        <div className="h-12 w-24 bg-brand-primary/50 rounded-lg"></div>
        <div className="h-12 w-24 bg-brand-primary/50 rounded-lg"></div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-8 w-full bg-brand-primary/30 rounded-md"></div>)}
      </div>
    </div>;
  }

  if (error || !data) {
    return (
      <div className="card p-3.5 h-[400px] flex flex-col justify-center items-center text-center">
        <h3 className="text-title font-semibold text-brand-text mb-3">Churn Signals</h3>
        <div className="text-xs text-brand-text-muted mb-3 font-medium max-w-xs">
          {error || 'No churn signals data available.'}
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-brand-text';
  };

  return (
    <div className="card p-3.5 flex flex-col h-[400px]">
      <h3 className="card-title mb-3">Churn Signals</h3>
      
      <div className="flex flex-wrap gap-4 mb-3 pb-3 border-b border-brand-border">
        <div>
          <div className="stat-label">At-Risk Users</div>
          <div className="card-metric text-red-400">{data.summary.totalAtRisk}</div>
        </div>
        <div>
          <div className="stat-label">New This Week</div>
          <div className="card-metric text-amber-400">{data.summary.newThisWeek}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scroll pr-1">
        <table className="data-table">
          <thead className="sticky top-0 bg-brand-surface z-10">
            <tr>
              <th>User</th>
              <th className="text-right">Score</th>
              <th className="text-right">Last Seen</th>
              <th className="text-center">7d Msgs</th>
            </tr>
          </thead>
          <tbody>
            {data.atRiskUsers.map((user) => (
              <tr key={user.id} className="group">
                <td>
                  <Link to={`/admin/users?userId=${encodeURIComponent(user.id)}`} className="block">
                    <div className="text-xs font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                      {user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-brand-text-muted flex items-center gap-1.5 mt-0.5">
                      <span className="capitalize">{user.tier}</span>
                      <span>•</span>
                      <span>{user.totalSessions} sessions</span>
                    </div>
                  </Link>
                </td>
                <td className="text-right">
                  <span className={`text-xs font-semibold ${getScoreColor(user.churnScore)}`}>
                    {user.churnScore}
                  </span>
                </td>
                <td className="text-right text-xs text-brand-text-muted">
                  {user.daysSinceLastSession === null
                    ? 'Never Active'
                    : `${user.daysSinceLastSession}d Ago`}
                </td>
                <td className="text-center text-xs text-brand-text-muted">
                  {user.msgsLast7Days}
                </td>
              </tr>
            ))}
            {data.atRiskUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-brand-text-muted">
                  No users currently identified at risk.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
