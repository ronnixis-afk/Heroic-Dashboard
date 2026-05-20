import React, { useState } from 'react';
import { useCredits } from '../../hooks/useCredits';
import { cn } from '../../lib/utils';
import { Coins, History, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminCredits() {
  const { history, loading, status, setStatus, isProcessing, adjustCredits } = useCredits();
  const [formData, setFormData] = useState({
    userEmail: '',
    amount: 1000,
    reason: 'Regular Grant'
  });

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adjustCredits(formData.userEmail, formData.amount, formData.reason);
      setFormData({ userEmail: '', amount: 1000, reason: 'Regular Grant' });
    } catch (error) {
      console.error('[CreditsUI] Error calling adjustCredits:', error);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-h1">Credit Monitoring</h1>
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
        {/* Adjustment Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-4 md:p-6">
            <h2 className="mb-4 md:mb-6 flex items-center gap-2 text-xl">
              <Coins className="text-brand-accent" size={24} />
              Grant Credits
            </h2>

            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-brand-text-muted">Target User Email</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={18} />
                  <input 
                    type="text" 
                    required
                    value={formData.userEmail}
                    onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                    placeholder="ronnixis@gmail.com"
                    className="input-field w-full !pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-brand-text-muted">Amount</label>
                <div className="flex flex-col gap-3">
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                    className="input-field w-full"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[500, 1000, 5000].map(val => (
                      <button 
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: val })}
                        className="flex-1 rounded-lg border border-brand-primary/20 bg-brand-bg px-3 py-2 text-[10px] md:text-xs font-bold hover:bg-brand-primary/20 transition-colors"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-brand-text-muted">Reason / Note</label>
                <select 
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input-field w-full"
                >
                  <option>Regular Grant</option>
                  <option>System Replenishment</option>
                  <option>Bug Compensation</option>
                  <option>Refund</option>
                  <option>Custom Adjustment</option>
                </select>
              </div>

              <AnimatePresence>
                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'flex items-start gap-2 rounded-xl p-3 text-xs font-medium',
                      status.type === 'success' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-red-400/10 text-red-400'
                    )}
                  >
                    {status.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5" /> : <AlertCircle size={16} className="mt-0.5" />}
                    <span className="flex-1">{status.msg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="btn-primary w-full shadow-[0_0_20px_rgba(62,207,142,0.2)] mt-2 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Process Adjustment'}
              </button>
            </form>
          </div>
        </div>

        {/* History Log */}
        <div className="lg:col-span-2">
          <div className="glass-panel h-full overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-brand-primary/10">
              <h2 className="flex items-center gap-2 text-xl">
                <History className="text-brand-text-muted" size={24} />
                Adjustment History
              </h2>
            </div>
            
            <div className="flex-1 overflow-x-auto custom-scrollbar">
              <div className="min-w-[600px]">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User ID</th>
                      <th>Amount</th>
                      <th>Reason</th>
                      <th>Admin ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loading && history.map((item) => (
                      <tr key={item.id}>
                        <td className="text-xs text-brand-text-muted whitespace-nowrap">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just Now'}
                        </td>
                        <td>
                          <span className="font-mono text-xs">{item.userId ? `${item.userId.slice(0, 15)}...` : 'Unknown'}</span>
                        </td>
                        <td>
                          <span className={cn(
                            'font-bold',
                            item.amount > 0 ? 'text-brand-accent' : 'text-red-400'
                          )}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </span>
                        </td>
                        <td className="text-xs font-medium whitespace-nowrap">{item.reason}</td>
                        <td className="text-[10px] text-brand-text-muted whitespace-nowrap">
                          {item.adminId ? `${item.adminId.slice(0, 15)}...` : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="py-20 text-center text-brand-text-muted italic">
                  Loading Adjustment History...
                </div>
              )}
              {!loading && history.length === 0 && (
                <div className="py-20 text-center text-brand-text-muted italic">
                  No Adjustments Recorded Yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
