import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { ShieldAlert, Sparkles, HelpCircle, Search, Calendar, Monitor, Globe, Compass, Cpu, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, StatusBanner, EmptyState } from '../../components/ui';

interface FeedbackItem {
  id: string;
  userId: string;
  type: string;
  category: string;
  message: string;
  metadata: any;
  createdAt: string;
  User?: {
    email: string;
  };
}

const FEEDBACK_LIMIT = 200;
const REALTIME_REFRESH_DEBOUNCE_MS = 5000;

export default function AdminFeedback() {
  const { getToken } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);

      const { data: rows, error: dbError } = await supabase
        .from('Feedback')
        .select('id,userId,type,category,message,metadata,createdAt')
        .order('createdAt', { ascending: false })
        .limit(FEEDBACK_LIMIT);

      if (dbError) throw dbError;

      const userIds = [...new Set((rows || []).map((r) => r.userId).filter(Boolean))];
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

      setFeedback(
        (rows || []).map((row) => ({
          ...row,
          User: row.userId && emailByUserId[row.userId]
            ? { email: emailByUserId[row.userId] }
            : undefined,
        }))
      );
    } catch (err: any) {
      console.error('[AdminFeedback] Fetch error:', err);
      setError(err.message || 'Failed to retrieve feedback data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    
    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        let refreshTimer: ReturnType<typeof setTimeout> | null = null;
        const subscription = supabase
          .channel('public:Feedback')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Feedback' }, () => {
            if (refreshTimer) clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => {
              fetchFeedback();
            }, REALTIME_REFRESH_DEBOUNCE_MS);
          })
          .subscribe();

        return () => {
          if (refreshTimer) clearTimeout(refreshTimer);
          supabase.removeChannel(subscription);
        };
      } catch (e) {
        console.error('[AdminFeedback] Real-time setup failed:', e);
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
  }, [getToken]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are You Sure You Want To Delete This Feedback Entry?')) return;
    
    try {
      const token = await getToken({ template: 'supabase' }).catch(() => null);
      const supabase = getSupabaseClient(token || undefined);
      
      const { error: deleteError } = await supabase
        .from('Feedback')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setFeedback(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('[AdminFeedback] Delete error:', err);
      alert('Delete Failed: ' + err.message);
    }
  };

  const getFilteredFeedback = () => {
    return feedback.filter(item => {
      const matchesType = filterType === 'All' || item.type === filterType;
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      
      const email = item.User?.email || '';
      const messageText = item.message || '';
      const term = search.toLowerCase();
      const matchesSearch = 
        search === '' || 
        email.toLowerCase().includes(term) || 
        messageText.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term);

      return matchesType && matchesCategory && matchesSearch;
    });
  };

  const filteredItems = getFilteredFeedback();

  const getCategoriesList = () => {
    if (filterType === 'Bug Report') {
      return ['Gameplay', 'UI & Visuals', 'Performance', 'Audio', 'Other'];
    }
    if (filterType === 'Suggestion') {
      return ['Combat', 'Character & Skills', 'Lore & Story', 'Items & Forge', 'Other'];
    }
    return ['Gameplay', 'UI & Visuals', 'Performance', 'Audio', 'Combat', 'Character & Skills', 'Lore & Story', 'Items & Forge', 'General', 'Account', 'Other'];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Bug Report':
        return <ShieldAlert className="text-red-400" size={12} />;
      case 'Suggestion':
        return <Sparkles className="text-emerald-400" size={12} />;
      default:
        return <HelpCircle className="text-brand-text-muted" size={12} />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Bug Report':
        return 'badge-danger';
      case 'Suggestion':
        return 'badge-success';
      default:
        return 'badge-muted';
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="User Feedback"
        description="Review bug reports, suggestions, and other player submissions."
        actions={
          <button onClick={fetchFeedback} className="btn-secondary">
            Refresh Feed
          </button>
        }
      />

      <div className="card p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Messages Or Users..."
            className="input-field !pl-9"
          />
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterCategory('All');
            }}
            className="input-field cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field cursor-pointer"
          >
            <option value="All">All Categories</option>
            {getCategoriesList().map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
                const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

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
                          <span className={getTypeBadgeClass(item.type)}>
                            {getTypeIcon(item.type)}
                            {item.type}
                          </span>
                          <span className="badge-muted">{item.category}</span>
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

                        <p className="text-xs leading-relaxed text-brand-text-muted whitespace-pre-wrap">
                          {item.message}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn-icon hover:text-red-400 hover:bg-red-500/10 shrink-0"
                        title="Delete Feedback"
                        aria-label="Delete Feedback"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {hasMetadata && (
                      <div className="border-t border-brand-border pt-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="flex items-center gap-1 text-xs font-medium text-brand-text-muted hover:text-brand-text transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          <span>Game Context & Environment</span>
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
                                {item.metadata.worldName && (
                                  <div className="flex items-center gap-2">
                                    <Compass size={10} className="text-brand-text-muted" />
                                    <span className="text-brand-text-muted">World:</span>
                                    <span className="text-brand-text font-medium">
                                      {item.metadata.worldName}
                                    </span>
                                  </div>
                                )}
                                {item.metadata.location && (
                                  <div className="flex items-center gap-2">
                                    <Globe size={10} className="text-brand-text-muted" />
                                    <span className="text-brand-text-muted">Location:</span>
                                    <span className="text-brand-text font-medium">
                                      {[item.metadata.locale, item.metadata.location]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </span>
                                  </div>
                                )}
                                {item.metadata.skillConfiguration && (
                                  <div className="flex items-center gap-2">
                                    <Cpu size={10} className="text-brand-text-muted" />
                                    <span className="text-brand-text-muted">Genre/Skills:</span>
                                    <span className="text-brand-text font-medium">
                                      {item.metadata.skillConfiguration}
                                    </span>
                                  </div>
                                )}
                                {item.metadata.userAgent && (
                                  <div className="flex items-start gap-2 sm:col-span-2">
                                    <Monitor size={10} className="text-brand-text-muted mt-0.5" />
                                    <span className="text-brand-text-muted whitespace-nowrap">
                                      Agent:
                                    </span>
                                    <span
                                      className="text-brand-text truncate font-mono"
                                      title={item.metadata.userAgent}
                                    >
                                      {item.metadata.userAgent}
                                    </span>
                                  </div>
                                )}
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

          {loading && <EmptyState compact title="Loading Feedback Feed..." />}

          {!loading && filteredItems.length === 0 && (
            <EmptyState
              compact
              icon={HelpCircle}
              title="No Feedback Entries Found"
              description="Try adjusting your filters or refresh the feed."
            />
          )}
        </div>
      </div>
    </div>
  );
}
