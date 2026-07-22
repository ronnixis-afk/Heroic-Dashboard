import React, { useState } from 'react';
import { useNews, NewsHighlight, NewsItem } from '../../hooks/useNews';
import { cn } from '../../lib/utils';
import { Newspaper, Send, Clock, Eye, EyeOff, Edit3, Trash2, Image as ImageIcon, Sparkles, Plus, X, Radio, Tag, CheckSquare, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, EmptyState, StatusBanner, FilterTabs, RichTextEditor, RichTextContent } from '../../components/ui';
import { richTextToPlain } from '../../lib/richText';

export default function AdminNews() {
  const { news, loading, appVersion, updateAppVersion, createNews, updateNews, activatePopup, deactivatePopup, deleteNews } = useNews();
  const [activeTab, setActiveTab] = useState<'news' | 'popup'>('popup');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Version input state
  const [currentVersionInput, setCurrentVersionInput] = useState('');
  const [isUpdatingVersion, setIsUpdatingVersion] = useState(false);

  // Standard News Form Data
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    published: false,
  });

  // App Update & Patch Notes Form Data
  const [popupFormData, setPopupFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    version: 'v0.51',
    is_patch_note: true,
    is_popup: true,
    published: true,
    highlights: [] as NewsHighlight[],
    cta_label: '',
    cta_url: '',
  });

  const handleUpdateAppVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersionInput.trim()) return;
    setStatus(null);
    setIsUpdatingVersion(true);
    try {
      const updated = await updateAppVersion(currentVersionInput);
      setStatus({ type: 'success', msg: `Current App Version Updated To ${updated}.` });
      setCurrentVersionInput('');
    } catch (error: any) {
      console.error('[NewsUI] Failed to update app version:', error);
      setStatus({ type: 'error', msg: `Failed To Update App Version: ${error?.message || error?.details || ''}` });
    } finally {
      setIsUpdatingVersion(false);
    }
  };

  const resetForms = () => {
    setNewsFormData({ title: '', content: '', imageUrl: '', published: false });
    setPopupFormData({
      title: '',
      content: '',
      imageUrl: '',
      version: appVersion ? (appVersion.startsWith('v') ? appVersion : `v${appVersion}`) : 'v0.51',
      is_patch_note: true,
      is_popup: true,
      published: true,
      highlights: [],
      cta_label: '',
      cta_url: '',
    });
    setEditingId(null);
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      if (editingId) {
        await updateNews(editingId, { ...newsFormData, is_popup: false, is_patch_note: false });
        setStatus({ type: 'success', msg: 'Announcement Updated.' });
      } else {
        await createNews({ ...newsFormData, is_popup: false, is_patch_note: false });
        setStatus({ type: 'success', msg: 'Announcement Posted.' });
      }
      resetForms();
    } catch (error: any) {
      console.error('[NewsUI] Error saving news:', error);
      setStatus({ type: 'error', msg: `Failed To Save Announcement: ${error?.message || error?.details || ''}` });
    }
  };

  const handlePopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      if (editingId) {
        await updateNews(editingId, popupFormData);
        setStatus({ type: 'success', msg: 'App Update / Patch Notes Saved.' });
      } else {
        await createNews({
          ...popupFormData,
          active: false,
        });
        setStatus({ type: 'success', msg: 'App Update / Patch Notes Created.' });
      }
      resetForms();
    } catch (error: any) {
      console.error('[NewsUI] Error saving app update popup:', error);
      setStatus({ type: 'error', msg: `Failed To Save App Update: ${error?.message || error?.details || ''}` });
    }
  };

  const handleActivatePopup = async (item: NewsItem) => {
    setStatus(null);
    try {
      await activatePopup(item.id, item.version);
      setStatus({ type: 'success', msg: `App Update ${item.version || ''} Activated And Pushed To In-Game Users!` });
    } catch (error: any) {
      console.error('[NewsUI] Error activating popup:', error);
      setStatus({ type: 'error', msg: `Failed To Push App Update: ${error?.message || error?.details || ''}` });
    }
  };

  const handleDeactivatePopup = async (id: string) => {
    setStatus(null);
    try {
      await deactivatePopup(id);
      setStatus({ type: 'success', msg: 'App Update Deactivated.' });
    } catch (error: any) {
      console.error('[NewsUI] Error deactivating popup:', error);
      setStatus({ type: 'error', msg: `Failed To Deactivate App Update: ${error?.message || error?.details || ''}` });
    }
  };

  const handleEditItem = (item: NewsItem) => {
    setEditingId(item.id);
    setStatus(null);
    if (item.is_popup || item.is_patch_note) {
      setActiveTab('popup');
      setPopupFormData({
        title: item.title || '',
        content: item.content || '',
        imageUrl: item.imageUrl || '',
        version: item.version || appVersion,
        is_patch_note: item.is_patch_note ?? true,
        is_popup: item.is_popup ?? true,
        published: item.published,
        highlights: item.highlights || [],
        cta_label: item.cta_label || '',
        cta_url: item.cta_url || '',
      });
    } else {
      setActiveTab('news');
      setNewsFormData({
        title: item.title || '',
        content: item.content || '',
        imageUrl: item.imageUrl || '',
        published: item.published,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are You Sure You Want To Delete This Item?')) return;
    try {
      await deleteNews(id);
      setStatus({ type: 'success', msg: 'Item Deleted Successfully.' });
      if (editingId === id) resetForms();
    } catch (error) {
      console.error('[NewsUI] Error deleting news:', error);
      setStatus({ type: 'error', msg: 'Failed To Delete Item.' });
    }
  };

  const addHighlightRow = () => {
    setPopupFormData({
      ...popupFormData,
      highlights: [...popupFormData.highlights, { title: '', body: '' }],
    });
  };

  const updateHighlightRow = (index: number, field: 'title' | 'body', value: string) => {
    const next = [...popupFormData.highlights];
    next[index] = { ...next[index], [field]: value };
    setPopupFormData({ ...popupFormData, highlights: next });
  };

  const removeHighlightRow = (index: number) => {
    const next = popupFormData.highlights.filter((_, i) => i !== index);
    setPopupFormData({ ...popupFormData, highlights: next });
  };

  const newsItems = news.filter((n) => !n.is_popup && !n.is_patch_note);
  const popupItems = news.filter((n) => n.is_popup || n.is_patch_note);

  return (
    <div className="page">
      <PageHeader
        title="Global Announcements & Patch Notes"
        description="Manage live app versioning, public patch notes, news posts, and in-game popups."
      />

      {status && (
        <StatusBanner
          type={status.type}
          message={status.msg}
          onDismiss={() => setStatus(null)}
        />
      )}

      {/* Global App Version Card */}
      <div className="card p-3.5 mb-3 bg-brand-primary/5 border border-brand-accent/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent shrink-0">
            <Tag size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-text-muted font-medium">Active App Version:</span>
              <span className="badge-success font-mono font-bold text-xs">{appVersion}</span>
            </div>
            <p className="text-xs text-brand-text-muted pt-0.5">
              This version label is dynamically displayed across Header, World Selection, Account Drawer, and Landing Page.
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateAppVersion} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            required
            value={currentVersionInput}
            onChange={(e) => setCurrentVersionInput(e.target.value)}
            placeholder={`e.g. ${appVersion || 'v0.51'}`}
            className="input-field text-xs py-1.5 w-32 font-mono"
          />
          <button type="submit" disabled={isUpdatingVersion} className="btn-secondary text-xs py-1.5 gap-1 shrink-0">
            <Save size={12} />
            Set Version
          </button>
        </form>
      </div>

      <div className="mb-3">
        <FilterTabs
          options={[`App Updates & Patch Notes (${popupItems.length})`, `Global News Feed (${newsItems.length})`]}
          value={activeTab === 'popup' ? `App Updates & Patch Notes (${popupItems.length})` : `Global News Feed (${newsItems.length})`}
          onChange={(val) => {
            setActiveTab(val.startsWith('App Updates') ? 'popup' : 'news');
            resetForms();
          }}
        />
      </div>

      {activeTab === 'popup' ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* Left Column: App Update & Patch Notes Form */}
          <div className="space-y-3">
            <div className="card p-3.5">
              <h2 className="section-title mb-3 flex items-center gap-2">
                <Sparkles className="text-brand-accent" size={14} />
                {editingId ? 'Edit App Update & Patch Notes' : 'New App Update & Patch Notes'}
              </h2>

              <form onSubmit={handlePopupSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="input-label">Headline / Title</label>
                    <input
                      type="text"
                      required
                      value={popupFormData.title}
                      onChange={(e) => setPopupFormData({ ...popupFormData, title: e.target.value })}
                      placeholder="Early Access v0.51 Patch Notes"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="input-label">Release Version</label>
                    <input
                      type="text"
                      required
                      value={popupFormData.version}
                      onChange={(e) => setPopupFormData({ ...popupFormData, version: e.target.value })}
                      placeholder="v0.51"
                      className="input-field font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Overview & Summary</label>
                  <RichTextEditor
                    required
                    rows={4}
                    value={popupFormData.content}
                    onChange={(content) => setPopupFormData({ ...popupFormData, content })}
                    placeholder="Brief summary of fixes, balance changes, and new features..."
                  />
                  <p className="help-text mt-1">
                    Supports Bold, Italic, Bullet Lists, And Numbered Lists.
                  </p>
                </div>

                <div>
                  <label className="input-label">Banner Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
                    <input
                      type="url"
                      value={popupFormData.imageUrl}
                      onChange={(e) => setPopupFormData({ ...popupFormData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="input-field !pl-9"
                    />
                  </div>
                </div>

                {/* Dual Publishing Target Toggles */}
                <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-3 space-y-2">
                  <label className="input-label mb-1 flex items-center gap-1.5 text-brand-accent">
                    <CheckSquare size={13} />
                    Publishing Destinations
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-brand-primary/10 bg-brand-bg/60 hover:bg-brand-primary/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={popupFormData.is_patch_note}
                        onChange={(e) => setPopupFormData({ ...popupFormData, is_patch_note: e.target.checked })}
                        className="h-4 w-4 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                      />
                      <div>
                        <span className="text-xs font-semibold block">Public Patch Notes</span>
                        <span className="text-[10px] text-brand-text-muted block">Show in Landing Page changelog archive</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-brand-primary/10 bg-brand-bg/60 hover:bg-brand-primary/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={popupFormData.is_popup}
                        onChange={(e) => setPopupFormData({ ...popupFormData, is_popup: e.target.checked })}
                        className="h-4 w-4 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                      />
                      <div>
                        <span className="text-xs font-semibold block">In-Game Popup</span>
                        <span className="text-[10px] text-brand-text-muted block">Pop up once for active in-game users</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Feature Highlights Builder */}
                <div className="space-y-2 border-t border-brand-primary/10 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="input-label mb-0">Feature Highlights & Patch Notes</label>
                    <button
                      type="button"
                      onClick={addHighlightRow}
                      className="btn-ghost text-xs gap-1 py-0.5 px-2"
                    >
                      <Plus size={12} />
                      Add Item
                    </button>
                  </div>

                  {popupFormData.highlights.length === 0 ? (
                    <p className="text-xs text-brand-text-muted italic py-1">
                      No feature bullet points added yet. Click &quot;Add Item&quot; to list changes.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {popupFormData.highlights.map((hl, idx) => (
                        <div key={idx} className="rounded-lg border border-brand-primary/20 bg-brand-primary/5 p-2 space-y-1.5 relative">
                          <button
                            type="button"
                            onClick={() => removeHighlightRow(idx)}
                            className="absolute right-2 top-2 text-brand-text-muted hover:text-red-400"
                            aria-label="Remove Item"
                          >
                            <X size={12} />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-accent text-brand-bg text-[10px] font-semibold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              required
                              value={hl.title}
                              onChange={(e) => updateHighlightRow(idx, 'title', e.target.value)}
                              placeholder="Title (e.g. Combat Rebalancing)"
                              className="input-field text-xs py-1"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={hl.body}
                            onChange={(e) => updateHighlightRow(idx, 'body', e.target.value)}
                            placeholder="Details of fix or feature..."
                            className="input-field text-xs py-1 resize-none !h-auto"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optional Call-To-Action Link */}
                <div className="space-y-2 border-t border-brand-primary/10 pt-3">
                  <label className="input-label mb-0">Call-To-Action Button (Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={popupFormData.cta_label}
                      onChange={(e) => setPopupFormData({ ...popupFormData, cta_label: e.target.value })}
                      placeholder="Button Label (e.g. Read Full Changelog)"
                      className="input-field text-xs"
                    />
                    <input
                      type="url"
                      value={popupFormData.cta_url}
                      onChange={(e) => setPopupFormData({ ...popupFormData, cta_url: e.target.value })}
                      placeholder="Button Link URL (https://...)"
                      className="input-field text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-primary/10">
                  {editingId && (
                    <button type="button" onClick={resetForms} className="btn-ghost">
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn-primary">
                    <Send size={12} />
                    {editingId ? 'Update Release Entry' : 'Save Release Entry'}
                  </button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="card border border-brand-accent/30 p-4 space-y-3 bg-brand-bg/95 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-brand-primary/10">
                <span className="badge-muted flex items-center gap-1 text-brand-accent">
                  <Radio size={10} className="animate-pulse" />
                  Live Preview
                </span>
                <span className="text-xs text-brand-text-muted">Version Badge: {popupFormData.version}</span>
              </div>

              <div className="space-y-4 max-w-md mx-auto rounded-2xl border border-brand-primary/30 bg-brand-primary/5 p-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="badge-success text-xs font-mono">{popupFormData.version || 'v0.51'}</span>
                  <h3 className="text-base font-bold text-brand-text">
                    {popupFormData.title || 'Early Access Patch Notes'}
                  </h3>
                </div>

                {popupFormData.imageUrl && (
                  <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border border-brand-primary/20">
                    <img src={popupFormData.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                  </div>
                )}

                {popupFormData.content && (
                  <RichTextContent
                    html={popupFormData.content}
                    className="text-xs text-brand-text-muted leading-relaxed"
                  />
                )}

                {popupFormData.highlights.length > 0 && (
                  <div className="space-y-2">
                    {popupFormData.highlights.map((hl, i) => (
                      <div key={i} className="flex gap-2.5 items-start rounded-xl border border-brand-primary/20 bg-brand-primary/10 p-2.5">
                        <span className="w-5 h-5 rounded-full bg-brand-accent text-brand-bg text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-semibold text-brand-text leading-tight mb-0.5">
                            {hl.title || 'Highlight Title'}
                          </h4>
                          <p className="text-[11px] text-brand-text-muted leading-snug">
                            {hl.body || 'Highlight description body...'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button type="button" disabled className="btn-primary btn-md w-full rounded-xl">
                    Close
                  </button>
                  {popupFormData.cta_label && (
                    <button type="button" disabled className="btn-secondary btn-md w-full rounded-xl truncate">
                      {popupFormData.cta_label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: App Update & Patch Notes List */}
          <div className="space-y-3">
            <h3 className="section-title">Releases & Patch Notes ({popupItems.length})</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {!loading &&
                  popupItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={cn(
                        'card group p-3.5 space-y-2',
                        item.active ? 'border-brand-accent shadow-lg bg-brand-accent/5' : 'border-brand-primary/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 gap-3 overflow-hidden">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              className="h-14 w-20 rounded-md object-cover shrink-0 border border-brand-primary/20"
                              alt=""
                            />
                          )}
                          <div className="flex-1 space-y-1 overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.version && (
                                <span className="badge-muted font-mono font-bold text-[10px]">
                                  {item.version}
                                </span>
                              )}
                              <h4 className="truncate text-sm font-semibold">{item.title}</h4>
                              {item.active && (
                                <span className="badge-success flex items-center gap-1 text-[10px]">
                                  <Radio size={10} className="animate-pulse" /> Active Popup
                                </span>
                              )}
                              {item.is_patch_note && (
                                <span className="badge-secondary text-[10px]">Public Patch Note</span>
                              )}
                            </div>
                            <p className="text-xs text-brand-text-muted line-clamp-2">
                              {richTextToPlain(item.content)}
                            </p>
                            {item.highlights && item.highlights.length > 0 && (
                              <div className="text-[11px] text-brand-accent font-medium">
                                • {item.highlights.length} Highlights Listed
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={() => handleEditItem(item)} className="btn-icon" aria-label="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn-icon hover:text-red-400 hover:bg-red-500/10"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Push / Activate Controls */}
                      <div className="flex items-center justify-between pt-2 border-t border-brand-primary/10">
                        <span className="text-xs text-brand-text-muted flex items-center gap-1">
                          <Clock size={11} />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just Now'}
                        </span>
                        {item.active ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivatePopup(item.id)}
                            className="btn-ghost text-xs hover:text-red-400 gap-1"
                          >
                            <EyeOff size={12} />
                            Deactivate Popup
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivatePopup(item)}
                            className="btn-primary text-xs gap-1.5 py-1 px-3 shadow-lg shadow-brand-accent/20"
                          >
                            <Radio size={12} />
                            Push / Activate Update
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {loading && <EmptyState compact title="Loading Patch Notes..." />}
              {!loading && popupItems.length === 0 && (
                <EmptyState
                  compact
                  icon={Sparkles}
                  title="No Patch Notes or Popups Created"
                  description="Create your first patch note using the form on the left."
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Global News Feed Tab */
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="card p-3.5">
              <h2 className="section-title mb-3 flex items-center gap-2">
                <Newspaper className="text-brand-accent" size={14} />
                {editingId ? 'Edit Entry' : 'New Announcement'}
              </h2>

              <form onSubmit={handleNewsSubmit} className="space-y-3">
                <div>
                  <label className="input-label">Headline</label>
                  <input
                    type="text"
                    required
                    value={newsFormData.title}
                    onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                    placeholder="Game Update v2.0 - The Dragon's Lair"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="input-label">Content</label>
                  <RichTextEditor
                    required
                    rows={6}
                    value={newsFormData.content}
                    onChange={(content) => setNewsFormData({ ...newsFormData, content })}
                    placeholder="Write the details here..."
                  />
                  <p className="help-text mt-1">
                    Supports Bold, Italic, Bullet Lists, And Numbered Lists.
                  </p>
                </div>

                <div>
                  <label className="input-label">Banner Image URL (Optional)</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
                    <input
                      type="url"
                      value={newsFormData.imageUrl}
                      onChange={(e) => setNewsFormData({ ...newsFormData, imageUrl: e.target.value })}
                      placeholder="https://..."
                      className="input-field !pl-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newsFormData.published}
                      onChange={(e) => setNewsFormData({ ...newsFormData, published: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                    />
                    <span className="text-xs font-medium">Publish Immediately</span>
                  </label>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {editingId && (
                      <button type="button" onClick={resetForms} className="btn-ghost flex-1 sm:flex-none">
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn-primary flex-1 sm:flex-none">
                      <Send size={12} />
                      {editingId ? 'Update' : 'Post'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="section-title">Recent Posts ({newsItems.length})</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {!loading &&
                  newsItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className={cn('card group p-3', !item.published && 'border-dashed opacity-70')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-1 gap-2 overflow-hidden">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              className="h-10 w-10 sm:h-12 sm:w-12 rounded-md object-cover shrink-0"
                              alt=""
                            />
                          )}
                          <div className="flex-1 space-y-0.5 overflow-hidden">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <h4 className="truncate text-xs font-medium">{item.title}</h4>
                              {!item.published && <span className="badge-danger shrink-0">Draft</span>}
                            </div>
                            <p className="text-xs text-brand-text-muted line-clamp-1 sm:line-clamp-2">
                              {richTextToPlain(item.content)}
                            </p>
                            <div className="flex items-center gap-2 pt-0.5 text-xs text-brand-text-muted">
                              <span className="flex items-center gap-1">
                                <Clock size={10} />{' '}
                                {item.createdAt
                                  ? new Date(item.createdAt).toLocaleDateString()
                                  : 'Just Now'}
                              </span>
                              <span className="flex items-center gap-1">
                                {item.published ? (
                                  <>
                                    <Eye size={10} /> Visible
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={10} /> Hidden
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button onClick={() => handleEditItem(item)} className="btn-icon" aria-label="Edit">
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn-icon hover:text-red-400 hover:bg-red-500/10"
                            aria-label="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {loading && <EmptyState compact title="Loading Announcements..." />}
              {!loading && newsItems.length === 0 && (
                <EmptyState
                  compact
                  icon={Newspaper}
                  title="No Announcements Found"
                  description="Post your first news item using the form on the left."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
