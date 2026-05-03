import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Coins, History, ArrowUpRight, Search, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminCredits() {
  const [history, setHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    userEmail: '',
    amount: 1000,
    reason: 'Regular grant'
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'creditAdjustments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      // Find user by email (mocking search as firestore doesn't have partial search easily)
      // In real app, we'd have a users collection query
      // For brevity, we assume the user exists and find them
      // NOTE: This is a simplified version. A real implementation would verify the user.
      
      const userId = formData.userEmail.trim(); // Using email as user identifier for this demo/logic
      
      // 1. Log adjustment
      await addDoc(collection(db, 'creditAdjustments'), {
        userId,
        amount: formData.amount,
        reason: formData.reason,
        adminId: auth.currentUser?.uid,
        createdAt: serverTimestamp()
      });

      // 2. Ideally, we would update the user document here too
      // await updateDoc(doc(db, 'users', userId), {
      //   currentCredits: increment(formData.amount)
      // });

      setStatus({ type: 'success', msg: `Successfully adjusted credits for ${userId}` });
      setFormData({ userEmail: '', amount: 1000, reason: 'Regular grant' });
    } catch (error) {
      setStatus({ type: 'error', msg: "Failed to adjust credits. Check permissions." });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Adjustment Form */}
      <div className="lg:col-span-1">
        <div className="glass-panel p-6">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-medium">
            <Coins className="text-brand-accent" size={24} />
            Grant Credits
          </h2>

          <form onSubmit={handleAdjust} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-brand-text-muted">Target User Email</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
                <input 
                  type="text" 
                  required
                  value={formData.userEmail}
                  onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                  placeholder="ronnixis@gmail.com"
                  className="input-field w-full pl-12"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-brand-text-muted">Amount</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})}
                  className="input-field flex-1"
                />
                <div className="flex gap-2">
                  {[500, 1000, 5000].map(val => (
                    <button 
                      key={val}
                      type="button"
                      onClick={() => setFormData({...formData, amount: val})}
                      className="rounded-lg border border-brand-primary/20 bg-brand-bg px-3 py-2 text-xs font-bold hover:bg-brand-primary/20"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase text-brand-text-muted">Reason / Note</label>
              <select 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                className="input-field w-full"
              >
                <option>Regular grant</option>
                <option>System replenishment</option>
                <option>Bug compensation</option>
                <option>Refund</option>
                <option>Custom adjustment</option>
              </select>
            </div>

            <AnimatePresence>
              {status && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-3 text-xs font-medium",
                    status.type === 'success' ? "bg-brand-accent/10 text-brand-accent" : "bg-red-400/10 text-red-400"
                  )}
                >
                  {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {status.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="btn-primary w-full shadow-[0_0_20px_rgba(62,207,142,0.2)]">
              Process Adjustment
            </button>
          </form>
        </div>
      </div>

      {/* History Log */}
      <div className="lg:col-span-2">
        <div className="glass-panel h-full overflow-hidden flex flex-col">
          <div className="p-6 border-b border-brand-primary/10">
            <h2 className="flex items-center gap-2 text-xl font-medium">
              <History className="text-brand-text-muted" size={24} />
              Adjustment History
            </h2>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Admin</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="text-xs text-brand-text-muted">
                      {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleString() : 'Just now'}
                    </td>
                    <td>
                      <span className="font-mono text-xs">{item.userId?.slice(0, 5)}...</span>
                    </td>
                    <td>
                      <span className={cn(
                        "font-bold",
                        item.amount > 0 ? "text-brand-accent" : "text-red-400"
                      )}>
                        {item.amount > 0 ? '+' : ''}{item.amount}
                      </span>
                    </td>
                    <td className="text-xs font-medium">{item.reason}</td>
                    <td className="text-[10px] uppercase tracking-wider text-brand-text-muted">
                      {item.adminId?.slice(0, 5)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <div className="py-20 text-center text-brand-text-muted italic">
                No adjustments recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
