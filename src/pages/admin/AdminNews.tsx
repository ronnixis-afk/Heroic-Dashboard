import React, { useState } from 'react';
import { useNews } from '../../hooks/useNews';
import { cn } from '../../lib/utils';
import { Newspaper, Send, Clock, Eye, EyeOff, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/ui';

export default function AdminNews() {
  const { news, loading, createNews, updateNews, deleteNews } = useNews();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    published: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateNews(editingId, formData);
      } else {
        await createNews(formData);
      }
      resetForm();
    } catch (error) {
      console.error('[NewsUI] Error saving news:', error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', imageUrl: '', published: false });
    setEditingId(null);
  };

  const handleEdit = (item: any) => {
    setFormData({
      title: item.title,
      content: item.content,
      imageUrl: item.imageUrl || '',
      published: item.published
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteNews(id);
      } catch (error) {
        console.error('[NewsUI] Error deleting news:', error);
      }
    }
  };

  return (
    <div className="page">
      <PageHeader title="Global Announcements" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Newspaper className="text-brand-accent" size={16} />
              {editingId ? 'Edit Entry' : 'New Announcement'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="input-label">Headline</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Game Update v2.0 - The Dragon's Lair"
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="input-label">Content</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the details here... supports multi-line text."
                  className="input-field resize-none !h-auto py-2"
                />
              </div>
              
              <div>
                <label className="input-label">Banner Image URL (Optional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
                  <input 
                    type="url" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="input-field !pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                  />
                  <span className="text-xs">Publish Immediately</span>
                </label>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="btn-ghost flex-1 sm:flex-none"
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-1.5">
                    <Send size={14} />
                    {editingId ? 'Update' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="card overflow-hidden border-dashed border-brand-accent/30 p-3.5 opacity-80 hidden sm:block">
            <span className="badge-accent mb-3">Live Preview</span>
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Preview" className="mb-3 h-32 w-full rounded-lg object-cover" />
            )}
            <h3 className="text-title font-semibold mb-1">{formData.title || 'Your Headline Here'}</h3>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-brand-text-muted">
              {formData.content || 'Your Announcement Content Will Appear Here Exactly as Formatted.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="section-title">Recent Posts ({news.length})</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {!loading && news.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    'card group p-3 transition-all hover:bg-brand-primary/5',
                    !item.published && 'border-dashed border-brand-text-muted/20 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-1 gap-2 overflow-hidden">
                      {item.imageUrl && (
                        <img src={item.imageUrl} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0" alt="" />
                      )}
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <h4 className="truncate text-xs font-medium">{item.title}</h4>
                          {!item.published && (
                            <span className="badge-danger flex-shrink-0">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-text-muted line-clamp-1 sm:line-clamp-2">{item.content}</p>
                        <div className="flex items-center gap-2 pt-0.5 text-xs text-brand-text-muted whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just Now'}
                          </span>
                          <span className="flex items-center gap-1">
                            {item.published ? (
                              <><Eye size={10} /> Visible</>
                            ) : (
                              <><EyeOff size={10} /> Hidden</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="btn-icon"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="btn-icon hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="py-12 text-center card text-xs text-brand-text-muted italic">
                Loading Announcements...
              </div>
            )}
            {!loading && news.length === 0 && (
              <div className="py-12 text-center card text-xs text-brand-text-muted italic">
                No Announcements Found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
