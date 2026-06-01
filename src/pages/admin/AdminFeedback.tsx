import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { getSupabaseClient } from '../../lib/supabase';
import { MessageSquare, ShieldAlert, Sparkles, HelpCircle, Search, Calendar, Monitor, Globe, Compass, Cpu, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function AdminFeedback() {
  const { getToken } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Search states
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
      
      const { data, error: dbError } = await supabase
        .from('Feedback')
        .select('*, User(email)')
        .order('createdAt', { ascending: false });

      if (dbError) throw dbError;
      setFeedback(data || []);
    } catch (err: any) {
      console.error('[AdminFeedback] Fetch error:', err);
      setError(err.message || 'Failed to retrieve feedback data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    
    // Setup real-time updates
    const setupSubscription = async () => {
      try {
        const token = await getToken({ template: 'supabase' }).catch(() => null);
        const supabase = getSupabaseClient(token || undefined);
        const subscription = supabase
          .channel('public:Feedback')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'Feedback' }, () => {
            fetchFeedback();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (e) {
        console.error('[AdminFeedback] Real-time setup failed:', e);
      }
    };

    let unsub: any;
    setupSubscription().then(fn => { unsub = fn; });
    return () => { if (unsub) unsub(); };
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

  // Categories list based on selected filter type
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
        return <ShieldAlert className="text-red-400" size={16} />;
      case 'Suggestion':
        return <Sparkles className="text-emerald-400" size={16} />;
      default:
        return <HelpCircle className="text-zinc-400" size={16} />;
    }
  };

  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case 'Bug Report':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Suggestion':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700/50';
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-h1">User Feedback</h1>
        <button
          onClick={fetchFeedback}
          className="btn-primary sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5"
        >
          Refresh Feed
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Messages Or Users..."
            className="input-field w-full !pl-11"
          />
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterCategory('All'); // Reset category filter on type change
            }}
            className="input-field w-full bg-[#18181c] border border-[#292a32] text-white py-2 px-4 rounded-xl cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Bug Report">Bug Report</option>
            <option value="Suggestion">Suggestion</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field w-full bg-[#18181c] border border-[#292a32] text-white py-2 px-4 rounded-xl cursor-pointer"
          >
            <option value="All">All Categories</option>
            {getCategoriesList().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Feedback Feed */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1 text-xs text-brand-text-muted font-bold">
          <span>Results: {filteredItems.length}</span>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {!loading && filteredItems.map((item) => {
              const isExpanded = expandedId === item.id;
              const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-4 md:p-6 transition-all hover:bg-brand-primary/5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Top Badges & Meta */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${getTypeBadgeStyles(item.type)}`}>
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-primary/20 text-brand-text border border-white/5 rounded-full">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-brand-text-muted flex items-center gap-1 ml-auto">
                          <Calendar size={12} />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="text-sm font-bold text-white">
                        {item.User?.email || <span className="text-brand-text-muted text-xs italic">Anonymous ({item.userId})</span>}
                      </div>

                      {/* Message Content */}
                      <p className="text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap pt-1">
                        {item.message}
                      </p>
                    </div>

                    {/* Delete button */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-2 text-brand-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Feedback"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Context Expansion */}
                  {hasMetadata && (
                    <div className="border-t border-[#1e1f24] pt-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>Game Context & Environment</span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#0c0c0e] rounded-2xl border border-white/5 text-[11px]">
                              {item.metadata.worldName && (
                                <div className="flex items-center gap-2">
                                  <Compass size={12} className="text-zinc-500" />
                                  <span className="text-zinc-500">World:</span>
                                  <span className="text-zinc-300 font-medium">{item.metadata.worldName}</span>
                                </div>
                              )}
                              {item.metadata.location && (
                                <div className="flex items-center gap-2">
                                  <Globe size={12} className="text-zinc-500" />
                                  <span className="text-zinc-500">Location:</span>
                                  <span className="text-zinc-300 font-medium">
                                    {[item.metadata.locale, item.metadata.location].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                              {item.metadata.skillConfiguration && (
                                <div className="flex items-center gap-2">
                                  <Cpu size={12} className="text-zinc-500" />
                                  <span className="text-zinc-500">Genre/Skills:</span>
                                  <span className="text-zinc-300 font-medium">{item.metadata.skillConfiguration}</span>
                                </div>
                              )}
                              {item.metadata.userAgent && (
                                <div className="flex items-start gap-2 sm:col-span-2">
                                  <Monitor size={12} className="text-zinc-500 mt-0.5" />
                                  <span className="text-zinc-500 whitespace-nowrap">Agent:</span>
                                  <span className="text-zinc-300 truncate font-mono" title={item.metadata.userAgent}>
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

          {loading && (
            <div className="py-20 text-center glass-panel text-brand-text-muted italic">
              Loading Feedback Feed...
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="py-20 text-center glass-panel text-brand-text-muted italic">
              No Feedback Entries Found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
