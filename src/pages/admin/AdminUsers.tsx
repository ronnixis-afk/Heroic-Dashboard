import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { Search, Filter, MoreHorizontal, ShieldCheck, Mail, Calendar, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

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

  const handleTierChange = async (userId: string, newTier: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { tier: newTier });
    } catch (error) {
      console.error("Error updating tier:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by email or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-12"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={16} />
            Filters
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm shadow-indigo-200 shadow-lg">
            Export Records
          </button>
        </div>
      </div>

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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Mail size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{user.email}</span>
                          <span className="text-[10px] text-slate-400 font-mono">UID: {user.id?.slice(0, 12)}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        user.tier === 'super_admin' ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" :
                        user.tier === 'hero' ? "bg-purple-100 text-purple-600 border border-purple-200" :
                        user.tier === 'adventurer' ? "bg-blue-100 text-blue-600 border border-blue-200" :
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      )}>
                        {user.tier === 'super_admin' && <ShieldCheck size={10} />}
                        {user.tier}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 transition-all shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
                            style={{ width: `${Math.min(100, (user.currentCredits / user.maxCredits) * 100)}%` }} 
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{user.currentCredits.toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-600">
                          {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Calendar size={10} />
                        {user.lastActive?.toDate ? new Date(user.lastActive.toDate()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'Online'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button className="rounded-lg p-2 text-slate-400 transition-all hover:bg-indigo-50 hover:text-indigo-600">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Slide-over/Modal would go here */}
    </div>
  );
}
