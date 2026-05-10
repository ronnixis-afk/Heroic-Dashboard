import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

interface AtRiskUser {
  id: string;
  email: string;
  tier: string;
  totalSessions: number;
  lastSession: string | null;
  daysSinceLastSession: number;
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
  const { getToken } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_RPG_API_URL}/api/admin/analytics/churn-signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching churn signals analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [getToken]);

  if (loading || !data) {
    return <div className="glass-panel p-6 h-96 animate-pulse flex flex-col">
      <div className="h-6 w-48 bg-[#292a32] rounded mb-6"></div>
      <div className="flex gap-4 mb-8">
        <div className="h-16 w-32 bg-[#292a32]/50 rounded"></div>
        <div className="h-16 w-32 bg-[#292a32]/50 rounded"></div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-full bg-[#292a32]/30 rounded"></div>)}
      </div>
    </div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#ff5a36]'; // High Risk (Orange per design)
    if (score >= 60) return 'text-[#f59e0b]'; // Medium Risk
    return 'text-brand-text';
  };

  return (
    <div className="glass-panel p-6 flex flex-col h-[500px]">
      <h3 className="text-lg font-medium text-brand-text mb-4">Churn Signals</h3>
      
      <div className="flex gap-6 mb-6 pb-6 border-b border-[#292a32]">
        <div>
          <div className="text-xs font-medium text-[#8b8c94] mb-1">At-Risk Users</div>
          <div className="text-3xl font-bold text-[#ff5a36]">{data.summary.totalAtRisk}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-[#8b8c94] mb-1">New This Week</div>
          <div className="text-3xl font-bold text-[#f59e0b]">{data.summary.newThisWeek}</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scroll pr-2">
        <table className="w-full text-left data-table">
          <thead className="sticky top-0 bg-[#1d1e24] z-10">
            <tr className="border-b border-[#292a32]">
              <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94]">User</th>
              <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94] text-right">Score</th>
              <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94] text-right">Last Seen</th>
              <th className="pb-3 px-2 text-[11px] font-medium text-[#8b8c94] text-center">7d Msgs</th>
            </tr>
          </thead>
          <tbody>
            {data.atRiskUsers.map((user) => (
              <tr key={user.id} className="border-b border-brand-primary/10 last:border-0 hover:bg-white/5 transition-colors group">
                <td className="py-3 px-2">
                  <Link to={`/admin/users/${user.id}`} className="block">
                    <div className="font-medium text-brand-text group-hover:text-brand-accent transition-colors">
                      {user.email.split('@')[0]}
                    </div>
                    <div className="text-xs text-brand-text-muted flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{user.tier}</span>
                      <span>•</span>
                      <span>{user.totalSessions} sessions</span>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className={`font-bold ${getScoreColor(user.churnScore)}`}>
                    {user.churnScore}
                  </span>
                </td>
                <td className="py-3 px-2 text-right text-brand-text-muted">
                  {user.daysSinceLastSession}d ago
                </td>
                <td className="py-3 px-2 text-center text-brand-text-muted">
                  {user.msgsLast7Days}
                </td>
              </tr>
            ))}
            {data.atRiskUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-brand-text-muted">
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
