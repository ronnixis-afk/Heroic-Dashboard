import React, { useMemo, useState } from 'react';
import {
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Flame,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  useRoadmap,
  ROADMAP_PHASES,
  ROADMAP_STATUSES,
  ROADMAP_CATEGORIES,
  RoadmapFormData,
  RoadmapItem,
} from '../../hooks/useRoadmap';
import { PageHeader, EmptyState, StatusBanner, FilterTabs, PageLoader } from '../../components/ui';
import { cn } from '../../lib/utils';

const EMPTY_FORM: RoadmapFormData = {
  title: '',
  summary: '',
  phase: 'Near Horizon',
  status: 'in_development',
  category: 'Gameplay',
  featured: false,
  published: true,
  sortOrder: 100,
};

const STATUS_BADGE: Record<string, string> = {
  in_development: 'badge-warning',
  next_in_queue: 'badge-muted',
  planned: 'badge-muted',
  shipped: 'badge-success',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  in_development: <Flame size={12} className="text-brand-accent" />,
  next_in_queue: <Clock size={12} className="text-amber-300" />,
  planned: <Compass size={12} className="text-sky-300" />,
  shipped: <CheckCircle2 size={12} className="text-emerald-400" />,
};

function statusLabel(status: string) {
  return ROADMAP_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export default function AdminRoadmap() {
  const { items, loading, error: loadError, createItem, updateItem, deleteItem } = useRoadmap();
  const [filter, setFilter] = useState<'All' | (typeof ROADMAP_PHASES)[number]>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoadmapFormData>(EMPTY_FORM);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((item) => item.phase === filter);
  }, [items, filter]);

  const filterOptions = useMemo(() => {
    const counts = ROADMAP_PHASES.map((phase) => {
      const count = items.filter((item) => item.phase === phase).length;
      return `${phase} (${count})`;
    });
    return [`All (${items.length})`, ...counts];
  }, [items]);

  const activeFilterLabel =
    filter === 'All'
      ? `All (${items.length})`
      : `${filter} (${items.filter((item) => item.phase === filter).length})`;

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      sortOrder: items.length > 0 ? Math.max(...items.map((i) => i.sortOrder)) + 10 : 10,
    });
    setEditingId(null);
  };

  const startEdit = (item: RoadmapItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      summary: item.summary,
      phase: item.phase,
      status: item.status,
      category: item.category,
      featured: item.featured,
      published: item.published,
      sortOrder: item.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      if (editingId) {
        await updateItem(editingId, formData);
        setStatus({ type: 'success', msg: 'Roadmap Item Updated.' });
      } else {
        await createItem(formData);
        setStatus({ type: 'success', msg: 'Roadmap Item Added.' });
      }
      resetForm();
    } catch (error: any) {
      console.error('[RoadmapUI] Save failed:', error);
      setStatus({ type: 'error', msg: `Failed To Save: ${error?.message || ''}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are You Sure You Want To Delete This Roadmap Item?')) return;
    setStatus(null);
    try {
      await deleteItem(id);
      if (editingId === id) resetForm();
      setStatus({ type: 'success', msg: 'Roadmap Item Deleted.' });
    } catch (error: any) {
      console.error('[RoadmapUI] Delete failed:', error);
      setStatus({ type: 'error', msg: `Failed To Delete: ${error?.message || ''}` });
    }
  };

  const handleTogglePublished = async (item: RoadmapItem) => {
    setStatus(null);
    try {
      await updateItem(item.id, {
        title: item.title,
        summary: item.summary,
        phase: item.phase,
        status: item.status,
        category: item.category,
        featured: item.featured,
        published: !item.published,
        sortOrder: item.sortOrder,
      });
      setStatus({
        type: 'success',
        msg: item.published ? 'Item Unpublished.' : 'Item Published.',
      });
    } catch (error: any) {
      setStatus({ type: 'error', msg: `Failed To Update Publish State: ${error?.message || ''}` });
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Product Roadmap"
        description="Add, edit, and publish roadmap milestones shown on the marketing site."
        actions={
          editingId ? (
            <button type="button" onClick={resetForm} className="btn-secondary text-xs gap-1">
              <Plus size={12} />
              New Item
            </button>
          ) : undefined
        }
      />

      {(status || loadError) && (
        <StatusBanner
          type={status?.type ?? 'error'}
          message={
            status?.msg ??
            `Failed To Load Roadmap: ${loadError instanceof Error ? loadError.message : 'Unknown Error'}`
          }
          onDismiss={status ? () => setStatus(null) : undefined}
        />
      )}

      <div className="mb-3">
        <FilterTabs
          options={filterOptions}
          value={activeFilterLabel}
          onChange={(val) => {
            if (val.startsWith('All')) {
              setFilter('All');
              return;
            }
            const phase = ROADMAP_PHASES.find((p) => val.startsWith(p));
            if (phase) setFilter(phase);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="card p-3.5">
          <h2 className="section-title mb-3 flex items-center gap-2">
            <Compass className="text-brand-accent" size={14} />
            {editingId ? 'Edit Roadmap Item' : 'New Roadmap Item'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="input-label">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Travel Events Overhaul"
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Summary</label>
              <textarea
                required
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Short public summary shown in the ledger and landing teaser."
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="input-label">Phase</label>
                <select
                  value={formData.phase}
                  onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                  className="input-field"
                >
                  {ROADMAP_PHASES.map((phase) => (
                    <option key={phase} value={phase}>
                      {phase}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  {ROADMAP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="input-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  {ROADMAP_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: Number.parseInt(e.target.value, 10) || 0 })
                  }
                  className="input-field"
                />
                <p className="help-text mt-1">Lower numbers appear first.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-brand-primary/10 bg-brand-bg/60">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                />
                <div>
                  <span className="text-xs font-semibold block">Published</span>
                  <span className="text-[10px] text-brand-text-muted block">Visible on /roadmap</span>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-brand-primary/10 bg-brand-bg/60">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                />
                <div>
                  <span className="text-xs font-semibold block">Featured</span>
                  <span className="text-[10px] text-brand-text-muted block">Highlight on landing</span>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary text-xs gap-1">
                {editingId ? 'Save Changes' : 'Add Item'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-secondary text-xs">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card p-3.5">
          <h2 className="section-title mb-3">Roadmap Ledger</h2>

          {loading ? (
            <PageLoader label="Loading Roadmap" />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No Roadmap Items"
              description={
                filter === 'All'
                  ? 'Add your first milestone using the form.'
                  : 'No items in this phase yet.'
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-xl border border-brand-primary/15 bg-brand-bg/50 p-3 space-y-2',
                    item.featured && 'border-brand-accent/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded',
                            STATUS_BADGE[item.status] || 'badge-muted'
                          )}
                        >
                          {STATUS_ICON[item.status]}
                          {statusLabel(item.status)}
                        </span>
                        <span className="badge-muted text-xs">{item.phase}</span>
                        <span className="badge-muted text-xs">{item.category}</span>
                        {!item.published && <span className="badge-danger text-xs">Draft</span>}
                        {item.featured && <span className="badge-success text-xs">Featured</span>}
                      </div>
                      <h3 className="text-title font-semibold text-brand-text m-0">{item.title}</h3>
                      <p className="text-xs text-brand-text-muted m-0 line-clamp-2">{item.summary}</p>
                      <p className="text-[10px] text-brand-text-muted m-0">Sort {item.sortOrder}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="btn-ghost text-xs gap-1 py-1 px-2"
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePublished(item)}
                      className="btn-ghost text-xs gap-1 py-1 px-2"
                    >
                      {item.published ? <EyeOff size={12} /> : <Eye size={12} />}
                      {item.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="btn-ghost text-xs gap-1 py-1 px-2 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
