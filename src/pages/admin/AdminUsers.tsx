import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '../../hooks/useUsers';
import { useAnalytics } from '../../hooks/useAnalytics';
import UsersFilterBar from '../../components/users/UsersFilterBar';
import UsersTable from '../../components/users/UsersTable';
import UserDetailModal from '../../components/users/UserDetailModal';

import { TableSkeleton } from '../../components/Skeleton';

export default function AdminUsers() {
  const { users, isSyncing, syncMessage, syncUsers, loading } = useUsers();
  const { trackEvent } = useAnalytics();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showManageAccess, setShowManageAccess] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    trackEvent('export_records_clicked');
    setTimeout(() => setIsExporting(false), 1500);
  };

  const handleSyncUsers = () => {
    trackEvent('sync_users_clicked');
    syncUsers();
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative overflow-hidden">
      <h1 className="text-2xl md:text-h1 mb-4 md:mb-8">User Management</h1>
      <UsersFilterBar 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        isSyncing={isSyncing}
        syncMessage={syncMessage}
        handleSyncUsers={handleSyncUsers}
        handleExport={handleExport}
        isExporting={isExporting}
      />

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }} 
            className="glass-panel p-4"
          >
            <p className="text-xs md:text-sm text-brand-text-muted">Placeholder for advanced filters (Tier, Credits, Date Range).</p>
          </motion.div>
        )}
      </AnimatePresence>

      <UsersTable 
        filteredUsers={filteredUsers}
        setSelectedUser={setSelectedUser}
        setShowManageAccess={setShowManageAccess}
        setShowSuspendConfirm={setShowSuspendConfirm}
        isLoading={loading}
      />

      <UserDetailModal 
        selectedUser={selectedUser}
        handleCloseModal={() => {
          setSelectedUser(null);
          setShowManageAccess(false);
          setShowSuspendConfirm(false);
        }}
        showManageAccess={showManageAccess}
        setShowManageAccess={setShowManageAccess}
        showSuspendConfirm={showSuspendConfirm}
        setShowSuspendConfirm={setShowSuspendConfirm}
      />
    </div>
  );
}
