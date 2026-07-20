import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Search,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, StatusBanner, EmptyState, StatCard } from '../../components/ui';
import {
  getSurveyById,
  listAllSurveys,
  questionLabelMap,
  ratingQuestionIds,
  textQuestionIds,
  type SurveyDefinition,
} from '../../constants/surveys/catalog';

interface SurveyAnswer {
  id: string;
  label?: string;
  type?: string;
  value: number | string;
}

interface SurveyItem {
  id: string;
  userId: string;
  surveyId: string;
  answers: SurveyAnswer[];
  createdAt: string;
  updatedAt: string;
  User?: { email: string };
}

const SURVEY_LIMIT = 500;
const REALTIME_REFRESH_DEBOUNCE_MS = 5000;

function parseAnswers(raw: unknown): SurveyAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is SurveyAnswer =>
      !!a && typeof a === 'object' && 'id' in a && 'value' in a
  ) as SurveyAnswer[];
}

function normalizeSurveyId(raw: string | undefined | null): string {
  if (!raw || raw === 'v1') return 'new-player-ui';
  return raw;
}

export default function AdminSurveys() {
  const { getToken } = useAuth();
  const catalog = listAllSurveys();
  const [selectedSurveyId, setSelectedSurveyId] = useState(catalog[0]?.id ?? 'new-player-ui');
  const [rows, setRows] = useState<SurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedSurvey: SurveyDefinition | undefined = getSurveyById(selectedSurveyId);
  const ratingIds = selectedSurvey ? ratingQuestionIds(selectedSurvey) : [];
  const textIds = selectedSurvey ? textQuestionIds(selectedSurvey) : [];
  const labels = selectedSurvey ? questionLabelMap(selectedSurvey) : {};

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);

      const { data: surveyRows, error: dbError } = await supabase
        .from('SurveyResponse')
        .select('id,userId,surveyId,answers,createdAt,updatedAt')
        .order('createdAt', { ascending: false })
        .limit(SURVEY_LIMIT);

      if (dbError) throw dbError;

      const userIds = [...new Set((surveyRows || []).map((r) => r.userId).filter(Boolean))];
      const emailByUserId: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabase
          .from('User')
          .select('id, email')
          .in('id', userIds);

        if (userError) throw userError;
        for (const u of users || []) {
          emailByUserId[u.id] = u.email;
        }
      }

      setRows(
        (surveyRows || []).map((row) => {
          const surveyId = normalizeSurveyId(
            (row as { surveyId?: string; surveyVersion?: string }).surveyId ??
              (row as { surveyVersion?: string }).surveyVersion
          );
          return {
            ...row,
            surveyId,
            answers: parseAnswers(row.answers),
            User:
              row.userId && emailByUserId[row.userId]
                ? { email: emailByUserId[row.userId] }
                : undefined,
          };
        })
      );
    } catch (err: unknown) {
      console.error('[AdminSurveys] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed To Retrieve Survey Data.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSurveys();

    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        let refreshTimer: ReturnType<typeof setTimeout> | null = null;
        const subscription = supabase
          .channel('public:SurveyResponse')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'SurveyResponse' },
            () => {
              if (refreshTimer) clearTimeout(refreshTimer);
              refreshTimer = setTimeout(() => {
                fetchSurveys();
              }, REALTIME_REFRESH_DEBOUNCE_MS);
            }
          )
          .subscribe();

        return () => {
          if (refreshTimer) clearTimeout(refreshTimer);
          supabase.removeChannel(subscription);
        };
      } catch (e) {
        console.error('[AdminSurveys] Real-time setup failed:', e);
      }
    };

    let unsub: (() => void) | undefined;
    let isMounted = true;
    setupSubscription().then((fn) => {
      if (isMounted) {
        unsub = fn;
      } else {
        fn?.();
      }
    });
    return () => {
      isMounted = false;
      unsub?.();
    };
  }, [getToken, fetchSurveys]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are You Sure You Want To Delete This Survey Response?')) return;

    try {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);

      const { error: deleteError } = await supabase
        .from('SurveyResponse')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      console.error('[AdminSurveys] Delete error:', err);
      alert('Delete Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const countsBySurvey = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of catalog) counts[s.id] = 0;
    for (const row of rows) {
      const id = normalizeSurveyId(row.surveyId);
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [rows, catalog]);

  const scopedRows = useMemo(
    () => rows.filter((r) => normalizeSurveyId(r.surveyId) === selectedSurveyId),
    [rows, selectedSurveyId]
  );

  const collation = useMemo(() => {
    const ratingStats: Record<
      string,
      { sum: number; count: number; distribution: Record<number, number> }
    > = {};
    for (const id of ratingIds) {
      ratingStats[id] = { sum: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    for (const row of scopedRows) {
      for (const answer of row.answers) {
        if (!ratingIds.includes(answer.id)) continue;
        const value = typeof answer.value === 'number' ? answer.value : Number(answer.value);
        if (!Number.isInteger(value) || value < 1 || value > 5) continue;
        const stats = ratingStats[answer.id];
        if (!stats) continue;
        stats.sum += value;
        stats.count += 1;
        stats.distribution[value] = (stats.distribution[value] || 0) + 1;
      }
    }

    return ratingStats;
  }, [scopedRows, ratingIds]);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return scopedRows;
    return scopedRows.filter((item) => {
      const email = item.User?.email || '';
      const textAnswers = item.answers
        .filter((a) => textIds.includes(a.id))
        .map((a) => String(a.value))
        .join(' ');
      return (
        email.toLowerCase().includes(term) ||
        textAnswers.toLowerCase().includes(term) ||
        item.userId.toLowerCase().includes(term)
      );
    });
  }, [scopedRows, search, textIds]);

  return (
    <div className="page">
      <PageHeader
        title="User Surveys"
        description="Collate insights per survey. Each survey has its own questions and response set."
        actions={
          <button type="button" onClick={fetchSurveys} className="btn-secondary">
            Refresh Surveys
          </button>
        }
      />

      <div className="card p-3.5">
        <label className="stat-label block mb-2">Survey</label>
        <div className="flex flex-wrap gap-2">
          {catalog.map((s) => {
            const active = s.id === selectedSurveyId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedSurveyId(s.id);
                  setExpandedId(null);
                  setSearch('');
                }}
                className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-brand-accent/15 border-brand-accent text-brand-text'
                    : 'bg-brand-bg border-brand-border text-brand-text-muted hover:text-brand-text'
                }`}
              >
                {s.title}
                <span className="ml-2 opacity-70">({countsBySurvey[s.id] || 0})</span>
              </button>
            );
          })}
        </div>
        {selectedSurvey && (
          <p className="help-text mt-3 mb-0">{selectedSurvey.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          label="Total Responses"
          value={loading ? '—' : String(scopedRows.length)}
        />
        {ratingIds.map((id) => {
          const stats = collation[id];
          const avg = stats && stats.count > 0 ? (stats.sum / stats.count).toFixed(1) : '—';
          return (
            <StatCard
              key={id}
              label={`Avg ${labels[id] || id}`}
              value={loading ? '—' : avg}
            />
          );
        })}
      </div>

      {ratingIds.length > 0 && (
        <div className="card p-3.5 space-y-4">
          <h2 className="text-title m-0">Rating Distributions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratingIds.map((id) => {
              const stats = collation[id] || {
                sum: 0,
                count: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              };
              const maxBucket = Math.max(1, ...Object.values(stats.distribution));
              return (
                <div key={id} className="space-y-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="stat-label">{labels[id] || id}</span>
                    <span className="text-xs text-brand-text-muted">
                      {stats.count > 0
                        ? `Avg ${(stats.sum / stats.count).toFixed(2)} · n=${stats.count}`
                        : 'No Ratings Yet'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {[1, 2, 3, 4, 5].map((score) => {
                      const count = stats.distribution[score] || 0;
                      const pct = stats.count > 0 ? (count / maxBucket) * 100 : 0;
                      return (
                        <div key={score} className="flex items-center gap-2 text-xs">
                          <span className="w-4 text-brand-text-muted tabular-nums">{score}</span>
                          <div className="flex-1 h-2 rounded-full bg-brand-bg border border-brand-border overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-accent/70 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-brand-text-muted tabular-nums">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search By Email, User Id, Or Text Answers..."
            className="input-field !pl-9"
          />
        </div>
      </div>

      {error && <StatusBanner type="error" message={error} onDismiss={() => setError(null)} />}

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="stat-label">Results: {filteredItems.length}</span>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {!loading &&
              filteredItems.map((item) => {
                const isExpanded = expandedId === item.id;
                const textAnswers = item.answers.filter((a) => textIds.includes(a.id));
                const ratingAnswers = item.answers.filter((a) => ratingIds.includes(a.id));

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="card p-3.5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="badge-muted">{item.surveyId}</span>
                          <span className="text-xs text-brand-text-muted flex items-center gap-1 ml-auto">
                            <Calendar size={10} />
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-brand-text">
                          {item.User?.email || (
                            <span className="text-brand-text-muted italic">
                              Anonymous ({item.userId})
                            </span>
                          )}
                        </div>

                        {textAnswers.map((textAnswer) => (
                          <p
                            key={textAnswer.id}
                            className="text-xs leading-relaxed text-brand-text-muted whitespace-pre-wrap"
                          >
                            <span className="text-brand-text font-medium">
                              {labels[textAnswer.id] || textAnswer.label || textAnswer.id}:{' '}
                            </span>
                            {String(textAnswer.value)}
                          </p>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="btn-icon hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        title="Delete Survey Response"
                        aria-label="Delete Survey Response"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {ratingAnswers.length > 0 && (
                      <div className="border-t border-brand-border pt-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="flex items-center gap-1 text-xs font-medium text-brand-text-muted hover:text-brand-text transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          <span>Rating Breakdown</span>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-2"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-brand-bg rounded-md border border-brand-border text-xs">
                                {ratingAnswers.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between gap-2">
                                    <span className="text-brand-text-muted">
                                      {labels[a.id] || a.label || a.id}
                                    </span>
                                    <span className="text-brand-text font-medium tabular-nums">
                                      {String(a.value)} / 5
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {loading && <EmptyState compact title="Loading Survey Responses..." />}

          {!loading && filteredItems.length === 0 && (
            <EmptyState
              compact
              icon={ClipboardList}
              title="No Responses For This Survey"
              description="Responses Appear Here After Players Submit This Survey In The App."
            />
          )}
        </div>
      </div>
    </div>
  );
}
