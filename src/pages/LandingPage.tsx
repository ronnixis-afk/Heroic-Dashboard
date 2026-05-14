import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, Sword, Book, Users, ArrowRight, Zap, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [news, setNews] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0A0A0A] text-brand-text overflow-x-hidden">
      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 py-6 max-w-7xl mx-auto z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield size={24} className="text-white" />
          </div>
          <span className="font-serif text-xl font-bold text-white">Heroic AI RPG</span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#8b8c94]">
          <a href="#" className="hover:text-indigo-600 transition-colors">Lore</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Mechanics</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          <Link to="/admin" className="rounded-xl border border-[#292a32] px-5 py-2 text-[#8b8c94] hover:bg-[#1e1f24] transition-all font-bold text-sm">
            Support Portal
          </Link>
          <Link to="/login" className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-gray-200 transition-all">
            Play Now
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white p-2"
        >
          {isMenuOpen ? <Zap size={24} className="text-indigo-500" /> : <Zap size={24} />}
        </button>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-[#141416] border-b border-[#292a32] p-6 flex flex-col gap-6 md:hidden shadow-2xl"
            >
              <a href="#" className="text-lg font-bold text-white">Lore</a>
              <a href="#" className="text-lg font-bold text-white">Mechanics</a>
              <a href="#" className="text-lg font-bold text-white">Pricing</a>
              <Link to="/admin" className="text-lg font-bold text-white">Support Portal</Link>
              <Link to="/login" className="bg-white text-black px-6 py-3 rounded-full font-bold text-center">
                Play Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 pt-12 md:pt-20 pb-24 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_rgba(62,207,142,0.05)_0%,_transparent_70%)] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#00b2ff]/20 bg-[#00b2ff]/5 px-4 py-1.5 text-[10px] font-bold text-[#00b2ff] mb-8"
          >
            <Sparkles size={14} />
            Powered by Gemini 1.5 Pro
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl font-bold tracking-tight mb-6 md:mb-8 leading-tight"
          >
            Your Story. Your Rules. <br />
            <span className="text-[#00b2ff]">Infinite Worlds.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[#8b8c94] font-medium mb-10 md:mb-12 max-w-2xl mx-auto"
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
            <button className="bg-white text-black px-8 py-4 rounded-full font-bold hover:bg-gray-200 transition-all w-full sm:w-auto flex items-center justify-center gap-2 text-lg md:text-xl">
              Forge Your Destiny <ArrowRight size={20} />
            </button>
            <button className="w-full sm:w-auto rounded-full border border-[#292a32] bg-[#1d1e24] px-8 py-4 text-lg md:text-xl font-bold hover:bg-[#292a32]/50 transition-all">
              Watch Trailer
            </button>
          </motion.div>
        </div>
      </section>

      {/* News Section (Managed by Admin) */}
      <section className="px-6 py-16 md:py-20 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold">Latest Chronicles</h2>
              <p className="text-sm text-[#8b8c94] font-medium mt-1">Updates from the world of Heroic RPG</p>
            </div>
            <button className="text-sm font-bold text-[#00b2ff] flex items-center gap-2 hover:underline w-fit">
              View History <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
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
                  <span className="text-[10px] font-bold text-[#00b2ff] mb-2 uppercase tracking-wider">Announcement</span>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-[#8b8c94] font-medium line-clamp-3 mb-6">
                    {item.content}
                  </p>
                  <div className="mt-auto pt-4 border-t border-[#292a32]/50 flex items-center justify-between text-xs text-[#8b8c94]">
                    <span>{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Today'}</span>
                    <button className="font-bold text-white hover:text-[#00b2ff] transition-colors">Read More</button>
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
      <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Core Mechanics</h2>
          <p className="text-sm text-[#8b8c94] font-medium">High-fidelity world building driven by the latest AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel md:col-span-2 p-6 md:p-8 flex flex-col justify-end min-h-[250px] md:min-h-[300px] relative overflow-hidden group">
            <Sword className="absolute -top-4 -right-4 size-24 md:size-32 text-[#00b2ff]/10 rotate-12 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl md:text-3xl font-bold mb-2">Dynamic Combat</h3>
            <p className="text-sm text-[#8b8c94] font-medium">No fixed damage numbers. Describe your strike, and the AI calculates the outcome based on surroundings.</p>
          </div>
          <div className="glass-panel p-6 md:p-8 flex flex-col justify-end min-h-[200px] md:min-h-[300px]">
            <Zap className="text-[#00b2ff] mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Instant Response</h3>
            <p className="text-sm text-[#8b8c94] font-medium">Sub-second generation for smooth storytelling.</p>
          </div>
          <div className="glass-panel p-6 md:p-8 flex flex-col justify-end min-h-[200px] md:min-h-[300px]">
             <Users className="text-[#00b2ff] mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Guild Support</h3>
            <p className="text-sm text-[#8b8c94] font-medium">Collaborate with allies in shared world instances.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#292a32]/30 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-[#00b2ff]" />
            <span className="font-serif font-bold">Heroic AI RPG</span>
          </div>
          <p className="text-xs text-[#8b8c94] font-medium">© 2026 Ghost Dimension Games. Built with Gemini AI.</p>
          <div className="flex gap-6 text-xs font-bold text-[#8b8c94]">
            <a href="#" className="hover:text-[#00b2ff] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#00b2ff] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#00b2ff] transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
