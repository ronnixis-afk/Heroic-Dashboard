import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Search, Filter, MoreHorizontal, ShieldCheck, Mail, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showManageAccess, setShowManageAccess] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1500);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setShowManageAccess(false);
    setShowSuspendConfirm(false);
  };

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted group-focus-within:text-brand-accent transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by email or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full !pl-12 bg-brand-surface/30 border-brand-primary/50 focus:bg-brand-surface/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200",
              showFilters 
                ? "bg-brand-accent/10 text-brand-accent border-brand-accent/50 shadow-[0_0_15px_rgba(0,178,255,0.1)]" 
                : "border-brand-primary bg-brand-surface/50 text-brand-text-muted hover:text-white hover:border-brand-primary/80"
            )}
          >
            <Filter size={16} />
            Filters
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="btn-primary flex items-center gap-2 text-sm shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export Records'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel p-4">
            <p className="text-sm text-brand-text-muted">Placeholder for advanced filters (Tier, Credits, Date Range).</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Table Card */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Access Level</th>
                <th>Credit Balance</th>
                <th>Registration</th>
                <th>Last Seen</th>
                <th className="text-right">Manage</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-brand-primary/10 transition-all duration-300 cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-brand-primary flex items-center justify-center text-indigo-400 group-hover:border-indigo-500/50 transition-colors">
                            <Mail size={18} />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-brand-accent transition-colors">{user.email}</span>
                          <span className="text-[10px] text-brand-text-muted font-mono tracking-tight">ID: {user.id?.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold transition-all shadow-sm",
                        user.tier === 'super_admin' ? "bg-indigo-500 text-white shadow-indigo-500/20" :
                        user.tier === 'hero' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/5" :
                        user.tier === 'adventurer' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-blue-500/5" :
                        "bg-brand-primary/20 text-brand-text-muted border border-brand-primary/30"
                      )}>
                        {user.tier === 'super_admin' && <ShieldCheck size={10} className="text-white" />}
                        {user.tier === 'super_admin' ? 'Super Admin' : user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 rounded-full bg-[#292a32] overflow-hidden">
                          <div 
                            className="h-full bg-brand-accent transition-all shadow-[0_0_8px_rgba(0,178,255,0.4)]" 
                            style={{ width: `${Math.min(100, ((user.currentCredits || 0) / (user.maxCredits || 1000)) * 100)}%` }} 
                          />
                        </div>
                        <span className="text-[11px] font-bold text-white">{user.currentCredits?.toLocaleString() || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-brand-text-muted">
                          {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold text-brand-text-muted flex items-center gap-1">
                        <Calendar size={10} />
                        {user.lastActive?.toDate ? new Date(user.lastActive.toDate()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Online'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowManageAccess(false);
                          setShowSuspendConfirm(false);
                        }}
                        className="rounded-lg p-2 text-brand-text-muted transition-all hover:bg-brand-primary/50 hover:text-white"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center text-brand-text-muted italic">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* User Details Slide-over Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-brand-primary bg-[#111114] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-white">User Details</h2>
                <button 
                  onClick={handleCloseModal}
                  className="rounded-full p-2 text-brand-text-muted hover:bg-brand-primary/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-indigo-500/20 border border-brand-primary flex items-center justify-center text-indigo-400">
                    <Mail size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedUser.email}</h3>
                    <p className="text-xs text-brand-text-muted font-mono">{selectedUser.id}</p>
                  </div>
                </div>
                
                <div className="glass-panel p-4">
                  <h4 className="text-sm font-bold text-brand-text-muted mb-4">Account Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-xs text-brand-text-muted">Access Level</span>
                      <span className="text-xs font-bold text-white">{selectedUser.tier === 'super_admin' ? 'Super Admin' : selectedUser.tier.charAt(0).toUpperCase() + selectedUser.tier.slice(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-brand-text-muted">Credits</span>
                      <span className="text-xs font-bold text-white">{selectedUser.currentCredits || 0} / {selectedUser.maxCredits || 1000}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-brand-text-muted">Registered</span>
                      <span className="text-xs font-bold text-white">
                        {selectedUser.createdAt?.toDate ? new Date(selectedUser.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 border-t border-brand-primary/50">
                  {/* Manage Access Section */}
                  <AnimatePresence>
                    {showManageAccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-panel p-4 mb-2"
                      >
                        <h4 className="text-sm font-bold text-white mb-2">Change Role</h4>
                        <select className="input-field w-full mb-3 text-sm">
                          <option>Super Admin</option>
                          <option>Hero</option>
                          <option>Adventurer</option>
                          <option>Free</option>
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => setShowManageAccess(false)} className="rounded-lg px-4 py-2 text-xs font-bold text-brand-text-muted hover:bg-brand-primary/20">Cancel</button>
                          <button onClick={() => setShowManageAccess(false)} className="btn-primary px-4 py-2 text-xs">Save Role</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Suspend Confirm Section */}
                  <AnimatePresence>
                    {showSuspendConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-2"
                      >
                        <h4 className="text-sm font-bold text-red-400 mb-2">Confirm Suspension</h4>
                        <p className="text-xs text-brand-text-muted mb-3">Are you sure you want to suspend this user? They will lose access immediately.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowSuspendConfirm(false)} className="rounded-lg px-4 py-2 text-xs font-bold text-brand-text-muted hover:bg-brand-primary/20">Cancel</button>
                          <button onClick={() => setShowSuspendConfirm(false)} className="rounded-full bg-red-500 text-white px-4 py-2 text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]">Confirm Suspend</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!showManageAccess && !showSuspendConfirm && (
                    <div className="flex gap-3">
                      <button onClick={() => setShowManageAccess(true)} className="btn-primary w-full flex justify-center items-center">Manage Access</button>
                      <button onClick={() => setShowSuspendConfirm(true)} className="rounded-full bg-red-500/10 px-6 py-2 text-sm font-bold text-red-400 hover:bg-red-500/20">Suspend</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
