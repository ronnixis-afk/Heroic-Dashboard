import React, { useState } from 'react';
import { useCredits } from '../../hooks/useCredits';
import { cn } from '../../lib/utils';
import { Coins, History, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/ui';

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
    <div className="page">
      <PageHeader title="Credit Monitoring" />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="card p-3.5">
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Coins className="text-brand-accent" size={16} />
              Grant Credits
            </h2>

            <form onSubmit={handleAdjust} className="space-y-3">
              <div>
                <label className="input-label">Target User Email</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" size={14} />
                  <input 
                    type="text" 
                    required
                    value={formData.userEmail}
                    onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                    placeholder="ronnixis@gmail.com"
                    className="input-field !pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Amount</label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                    className="input-field"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[500, 1000, 5000].map(val => (
                      <button 
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, amount: val })}
                        className="btn-secondary btn-sm flex-1"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="input-label">Reason / Note</label>
                <select 
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input-field"
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
                      'flex items-start gap-2 rounded-lg p-2.5 text-xs font-medium',
                      status.type === 'success' ? 'badge-accent' : 'badge-danger'
                    )}
                  >
                    {status.type === 'success' ? <CheckCircle2 size={14} className="mt-0.5" /> : <AlertCircle size={14} className="mt-0.5" />}
                    <span className="flex-1">{status.msg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Process Adjustment'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card h-full overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-brand-primary/10">
              <h2 className="section-title flex items-center gap-2">
                <History className="text-brand-text-muted" size={16} />
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
                            'font-semibold text-xs',
                            item.amount > 0 ? 'text-brand-accent' : 'text-red-400'
                          )}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </span>
                        </td>
                        <td className="text-xs font-medium whitespace-nowrap">{item.reason}</td>
                        <td className="text-xs text-brand-text-muted whitespace-nowrap">
                          {item.adminId ? `${item.adminId.slice(0, 15)}...` : 'Unknown'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="py-12 text-center text-xs text-brand-text-muted italic">
                  Loading Adjustment History...
                </div>
              )}
              {!loading && history.length === 0 && (
                <div className="py-12 text-center text-xs text-brand-text-muted italic">
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
