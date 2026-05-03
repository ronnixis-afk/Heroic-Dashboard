import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Sword, Book, Users, ArrowRight, Zap, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'news'), 
      where('published', '==', true), 
      orderBy('createdAt', 'desc'), 
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-brand-text">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield size={24} className="text-white" />
          </div>
          <span className="font-serif text-xl font-bold text-slate-900">Heroic AI RPG</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500 tracking-widest">
          <a href="#" className="hover:text-indigo-600 transition-colors">Lore</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Mechanics</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <Link to="/admin" className="rounded-xl border border-slate-200 px-5 py-2 text-slate-700 hover:bg-slate-50 transition-all font-bold">
            Support Portal
          </Link>
          <Link to="/login" className="btn-primary py-2.5 px-6 text-sm">
            Play Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_rgba(62,207,142,0.05)_0%,_transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/5 px-4 py-1.5 text-xs font-bold text-brand-accent mb-8"
          >
            <Sparkles size={14} />
            Powered by Gemini 1.5 Pro
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]"
          >
            Your Story. Your Rules. <br />
            <span className="text-brand-accent">Infinite Worlds.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-brand-text-muted mb-12 max-w-2xl mx-auto"
          >
            The first AI-native text adventure RPG where every decision matters. 
            Build worlds, forge alliances, and embark on quests powered by advanced LLMs.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-lg">
              Forge Your Destiny <ArrowRight size={20} />
            </button>
            <button className="w-full sm:w-auto rounded-xl border border-brand-primary/20 bg-brand-surface px-8 py-4 text-lg font-bold hover:bg-brand-primary/10 transition-all">
              Watch Trailer
            </button>
          </motion.div>
        </div>
      </section>

      {/* News Section (Managed by Admin) */}
      <section className="px-8 py-20 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-serif font-bold">Latest Chronicles</h2>
              <p className="text-brand-text-muted mt-1">Updates from the world of Heroic RPG</p>
            </div>
            <button className="text-sm font-bold text-brand-accent flex items-center gap-2 hover:underline">
              View History <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item, idx) => (
              <motion.article 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-panel group overflow-hidden flex flex-col h-full hover:border-brand-accent/30 transition-all"
              >
                {item.imageUrl ? (
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ) : (
                  <div className="h-48 bg-brand-primary/20 flex items-center justify-center">
                    <Book size={48} className="text-brand-primary/40" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold tracking-widest text-brand-accent mb-2">Announcement</span>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-brand-text-muted line-clamp-3 mb-6">
                    {item.content}
                  </p>
                  <div className="mt-auto pt-4 border-t border-brand-primary/10 flex items-center justify-between text-xs text-brand-text-muted">
                    <span>{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Today'}</span>
                    <button className="font-bold text-brand-text hover:text-brand-accent transition-colors">Read More</button>
                  </div>
                </div>
              </motion.article>
            ))}
            
            {news.length === 0 && Array.from({length: 3}).map((_, i) => (
              <div key={i} className="glass-panel p-6 h-64 animate-pulse bg-brand-primary/5" />
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section className="px-8 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4">Core Mechanics</h2>
          <p className="text-brand-text-muted">High-fidelity world building driven by the latest AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel md:col-span-2 p-8 flex flex-col justify-end min-h-[300px] relative overflow-hidden group">
            <Sword className="absolute -top-4 -right-4 size-32 text-brand-accent/10 rotate-12 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold mb-2">Dynamic Combat</h3>
            <p className="text-brand-text-muted">No fixed damage numbers. Describe your strike, and the AI calculates the outcome based on surroundings.</p>
          </div>
          <div className="glass-panel p-8 flex flex-col justify-end min-h-[300px]">
            <Zap className="text-brand-accent mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Instant Response</h3>
            <p className="text-sm text-brand-text-muted">Sub-second generation for smooth storytelling.</p>
          </div>
          <div className="glass-panel p-8 flex flex-col justify-end min-h-[300px]">
             <Users className="text-brand-accent mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Guild Support</h3>
            <p className="text-sm text-brand-text-muted">Collaborate with allies in shared world instances.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-brand-primary/10 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-brand-accent" />
            <span className="font-serif font-bold">Heroic AI RPG</span>
          </div>
          <p className="text-xs text-brand-text-muted">© 2026 Ghost Dimension Games. Built with Gemini AI.</p>
          <div className="flex gap-6 text-xs font-bold tracking-widest text-brand-text-muted">
            <a href="#" className="hover:text-brand-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-accent transition-colors">Terms</a>
            <a href="#" className="hover:text-brand-accent transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
