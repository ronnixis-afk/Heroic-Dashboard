import React from 'react';
import { Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
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
  );
}
