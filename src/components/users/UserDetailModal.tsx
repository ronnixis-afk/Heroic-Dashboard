import React from 'react';
import { Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserConsumptionChart from './UserConsumptionChart';

interface UserDetailModalProps {
  selectedUser: any;
  handleCloseModal: () => void;
  showManageAccess: boolean;
  setShowManageAccess: (show: boolean) => void;
  showSuspendConfirm: boolean;
  setShowSuspendConfirm: (show: boolean) => void;
}

export default function UserDetailModal({
  selectedUser,
  handleCloseModal,
  showManageAccess,
  setShowManageAccess,
  showSuspendConfirm,
  setShowSuspendConfirm
}: UserDetailModalProps) {
  if (!selectedUser) return null;

  return (
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
        className="fixed right-0 top-0 z-50 h-full w-full md:max-w-[50vw] border-l border-brand-primary bg-[#111114] p-8 shadow-2xl overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">User Details</h2>
          <button 
            onClick={handleCloseModal}
            className="rounded-full p-2 text-brand-text-muted hover:bg-brand-primary/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-indigo-500/20 border border-brand-primary flex items-center justify-center text-indigo-400 shadow-inner">
              <Mail size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{selectedUser.email}</h3>
              <p className="text-xs text-brand-text-muted font-mono mt-1 opacity-70">{selectedUser.id}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-brand-text-muted mb-6">Account Information</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-brand-text-muted">Access Level</span>
                    <span className="px-3 py-1 rounded-full bg-brand-primary/50 text-[10px] font-bold text-white tracking-wide">
                      {selectedUser.tier === 'super_admin' ? 'Super Admin' : selectedUser.tier?.charAt(0).toUpperCase() + selectedUser.tier?.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-brand-text-muted">Credits</span>
                    <span className="text-sm font-bold text-white">
                      {selectedUser.currentCredits?.toLocaleString() || 0} <span className="text-[#8b8c94] font-normal text-xs">/ {selectedUser.maxCredits?.toLocaleString() || 1000}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-brand-text-muted">Registered</span>
                    <span className="text-xs font-medium text-white">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-brand-text-muted mb-2">Quick Actions</h4>
              {!showManageAccess && !showSuspendConfirm && (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setShowManageAccess(true)} 
                    className="btn-primary w-full py-3 flex justify-center items-center gap-2"
                  >
                    Manage Access
                  </button>
                  <button 
                    onClick={() => setShowSuspendConfirm(true)} 
                    className="rounded-full bg-red-500/10 border border-red-500/20 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    Suspend User
                  </button>
                </div>
              )}

              {/* Manage Access Section */}
              <AnimatePresence>
                {showManageAccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel p-4"
                  >
                    <h4 className="text-sm font-bold text-white mb-3">Change Role</h4>
                    <select className="input-field w-full mb-4 text-sm bg-[#141416] border-brand-primary rounded-xl p-2.5">
                      <option>Super Admin</option>
                      <option>Hero</option>
                      <option>Adventurer</option>
                      <option>Free</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setShowManageAccess(false)} className="flex-1 rounded-lg px-4 py-2 text-xs font-bold text-brand-text-muted hover:bg-brand-primary/20">Cancel</button>
                      <button onClick={() => setShowManageAccess(false)} className="flex-1 btn-primary px-4 py-2 text-xs">Save Changes</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suspend Confirm Section */}
              <AnimatePresence>
                {showSuspendConfirm && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 p-5 shadow-xl"
                  >
                    <h4 className="text-sm font-bold text-red-400 mb-2">Confirm Suspension</h4>
                    <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">Are you sure you want to suspend this user? They will lose access to all premium features immediately.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowSuspendConfirm(false)} className="flex-1 rounded-lg px-4 py-2 text-xs font-bold text-brand-text-muted hover:bg-brand-primary/20">Cancel</button>
                      <button onClick={() => setShowSuspendConfirm(false)} className="flex-1 rounded-full bg-red-500 text-white px-4 py-2 text-xs font-bold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 transition-colors">Confirm</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-2">
            <UserConsumptionChart userId={selectedUser.id} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

