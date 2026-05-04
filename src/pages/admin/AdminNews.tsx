import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Newspaper, Plus, Trash2, Edit3, Image as ImageIcon, Send, Clock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminNews() {
  const [news, setNews] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    published: false
  });

  useEffect(() => {
    const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'news', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'news'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (error) {
      console.error("Error saving news:", error);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', imageUrl: '', published: false });
    setIsEditing(false);
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
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this news item?")) {
      await deleteDoc(doc(db, 'news', id));
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Editor Section */}
      <div className="space-y-6">
        <div className="glass-panel p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-medium">
            <Newspaper className="text-brand-accent" size={24} />
            {editingId ? 'Edit News Entry' : 'Create New Announcement'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-brand-text-muted">Headline</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Write the Announcement Details Here... Supports Multi-Line Text."
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
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/..."
                  className="input-field w-full !pl-12"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={formData.published}
                  onChange={(e) => setFormData({...formData, published: e.target.checked})}
                  className="h-4 w-4 rounded border-brand-primary/20 bg-brand-bg accent-brand-accent"
                />
                <span className="text-sm">Publish Immediately</span>
              </label>
              
              <div className="flex items-center gap-3">
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="rounded-xl px-6 py-3 text-sm font-medium hover:bg-brand-primary/10"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Send size={18} />
                  {editingId ? 'Update Entry' : 'Post Announcement'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="glass-panel overflow-hidden border-dashed border-brand-accent/30 p-6 opacity-80">
          <span className="mb-4 inline-block rounded-lg bg-brand-accent/10 px-3 py-1 text-[10px] font-bold text-brand-accent">Live Preview</span>
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Preview" className="mb-4 h-48 w-full rounded-xl object-cover" />
          )}
          <h3 className="mb-2 font-serif text-2xl font-bold">{formData.title || 'Your Headline Here'}</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-text-muted">
            {formData.content || 'Your Announcement Content Will Appear Here Exactly as Formatted.'}
          </p>
        </div>
      </div>

      {/* Feed Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-brand-text-muted">Recent Posts ({news.length})</h3>
        <div className="space-y-4">
          <AnimatePresence>
            {news.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "glass-panel group p-4 transition-all hover:bg-brand-primary/5",
                  !item.published && "border-dashed border-brand-text-muted/20 opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 gap-4">
                    {item.imageUrl && (
                      <img src={item.imageUrl} className="h-16 w-16 rounded-lg object-cover" alt="" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold line-clamp-1">{item.title}</h4>
                        {!item.published && <span className="text-[10px] text-red-400 font-bold">Draft</span>}
                      </div>
                      <p className="text-xs text-brand-text-muted line-clamp-2">{item.content}</p>
                      <div className="flex items-center gap-3 pt-2 text-[10px] text-brand-text-muted">
                        <span className="flex items-center gap-1"><Clock size={10} /> {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just Now'}</span>
                        <span className="flex items-center gap-1">
                          {item.published ? <><Eye size={10} /> Visible</> : <><EyeOff size={10} /> Hidden</>}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-full flex-col gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="rounded-lg p-2 text-brand-text-muted hover:bg-brand-accent/10 hover:text-brand-accent"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-2 text-brand-text-muted hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
