import React, { useState } from 'react';
import { useNews } from '../../hooks/useNews';
import { cn } from '../../lib/utils';
import { Newspaper, Send, Clock, Eye, EyeOff, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-h1">Global Announcements</h1>
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
        {/* Editor Section */}
        <div className="space-y-6">
          <div className="glass-panel p-4 md:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-xl">
              <Newspaper className="text-brand-accent" size={24} />
              {editingId ? 'Edit Entry' : 'New Announcement'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-brand-text-muted">Headline</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Game Update v2.0 - The Dragon's Lair"
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-bold text-brand-text-muted">Content</label>
                <textarea 
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the details here... supports multi-line text."
                  className="input-field w-full resize-none"
                />
              </div>
              
              <div>
                <label className="mb-2 block text-xs font-bold text-brand-text-muted">Banner Image URL (Optional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
                  <input 
                    type="url" 
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="input-field w-full !pl-12 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="h-4 w-4 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                  />
                  <span className="text-sm">Publish Immediately</span>
                </label>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={resetForm}
                      className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-brand-primary/10 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5">
                    <Send size={18} />
                    {editingId ? 'Update' : 'Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Preview */}
          <div className="glass-panel overflow-hidden border-dashed border-brand-accent/30 p-4 md:p-6 opacity-80 hidden sm:block">
            <span className="mb-4 inline-block rounded-lg bg-brand-accent/10 px-3 py-1 text-[10px] font-bold text-brand-accent">Live Preview</span>
            {formData.imageUrl && (
              <img src={formData.imageUrl} alt="Preview" className="mb-4 h-48 w-full rounded-xl object-cover" />
            )}
            <h3 className="mb-2 text-xl md:text-h2">{formData.title || 'Your Headline Here'}</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-text-muted">
              {formData.content || 'Your Announcement Content Will Appear Here Exactly as Formatted.'}
            </p>
          </div>
        </div>

        {/* Feed Management */}
        <div className="space-y-4">
          <h3 className="text-brand-text-muted text-sm font-bold">Recent Posts ({news.length})</h3>
          <div className="space-y-4">
            <AnimatePresence>
              {!loading && news.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    'glass-panel group p-4 transition-all hover:bg-brand-primary/5',
                    !item.published && 'border-dashed border-brand-text-muted/20 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 gap-3 overflow-hidden">
                      {item.imageUrl && (
                        <img src={item.imageUrl} className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover flex-shrink-0" alt="" />
                      )}
                      <div className="flex-1 space-y-1 overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <h4 className="truncate text-sm sm:text-body">{item.title}</h4>
                          {!item.published && (
                            <span className="text-[8px] sm:text-[10px] text-red-400 font-bold px-1.5 py-0.5 bg-red-400/10 rounded-full flex-shrink-0">
                              Draft
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-text-muted line-clamp-1 sm:line-clamp-2">{item.content}</p>
                        <div className="flex items-center gap-3 pt-1 text-[9px] sm:text-[10px] text-brand-text-muted whitespace-nowrap">
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
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
                      >
                        <Edit3 size={14} className="sm:size-[16px]" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-brand-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} className="sm:size-[16px]" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="py-20 text-center glass-panel text-brand-text-muted italic">
                Loading Announcements...
              </div>
            )}
            {!loading && news.length === 0 && (
              <div className="py-20 text-center glass-panel text-brand-text-muted italic">
                No Announcements Found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
