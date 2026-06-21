import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '../../hooks/useUsers';
import { useAnalytics } from '../../hooks/useAnalytics';
import UsersFilterBar from '../../components/users/UsersFilterBar';
import UsersTable from '../../components/users/UsersTable';
import UserDetailModal from '../../components/users/UserDetailModal';
import { PageHeader } from '../../components/ui';
import { Database, Save } from 'lucide-react';
import { formatBytes } from '../../lib/utils';

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

  const totalSavesSize = users.reduce((acc: number, user: any) => acc + (user.saveStats?.total_bytes || 0), 0);
  const totalSavesCount = users.reduce((acc: number, user: any) => acc + (Number(user.saveStats?.save_count) || 0), 0);

  const filteredUsers = users.filter(
    (user: any) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      <PageHeader title="User Management" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <h3 className="card-title">Total Cloud Storage</h3>
            <p className="text-xs text-brand-text-muted mt-0.5 font-medium">Aggregated across all world saves</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="card-metric text-brand-accent">
                {loading ? 'Loading...' : formatBytes(totalSavesSize)}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
            <Database size={20} />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between">
          <div>
            <h3 className="card-title">Active Cloud Saves</h3>
            <p className="text-xs text-brand-text-muted mt-0.5 font-medium">Total registered adventure files</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="card-metric text-white">
                {loading ? 'Loading...' : totalSavesCount.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <Save size={20} />
          </div>
        </div>
      </div>

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
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="card p-3"
          >
            <p className="text-xs text-brand-text-muted">
              Placeholder for advanced filters (Tier, Credits, Date Range).
            </p>
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
