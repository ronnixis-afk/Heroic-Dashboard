import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers } from '../../hooks/useUsers';
import { useAnalytics } from '../../hooks/useAnalytics';
import UsersFilterBar from '../../components/users/UsersFilterBar';
import UsersTable from '../../components/users/UsersTable';
import UserDetailModal from '../../components/users/UserDetailModal';
import { PageHeader, StatCard, StatusBanner } from '../../components/ui';
import { Database, Save } from 'lucide-react';
import { formatBytes } from '../../lib/utils';

export default function AdminUsers() {
  const { users, isSyncing, syncMessage, syncUsers, loading } = useUsers();
  const { trackEvent } = useAnalytics();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showManageAccess, setShowManageAccess] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId || loading || users.length === 0) return;
    const match = users.find((user: { id?: string }) => user.id === userId);
    if (match) {
      setSelectedUser(match);
    }
  }, [searchParams, users, loading]);

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
      <PageHeader
        title="User Management"
        description="Search, sync, and inspect player accounts and cloud save usage."
      />

      {syncMessage && (
        <StatusBanner
          type={syncMessage.toLowerCase().includes('fail') || syncMessage.toLowerCase().includes('error') ? 'error' : 'success'}
          message={syncMessage}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatCard
          label="Total Cloud Storage"
          description="Aggregated across all world saves"
          value={loading ? '—' : formatBytes(totalSavesSize)}
          icon={Database}
          accent
        />
        <StatCard
          label="Active Cloud Saves"
          description="Total registered adventure files"
          value={loading ? '—' : totalSavesCount.toLocaleString()}
          icon={Save}
        />
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
            <p className="help-text">
              Advanced filters for tier, credits, and date range will appear here.
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
          if (searchParams.has('userId')) {
            const next = new URLSearchParams(searchParams);
            next.delete('userId');
            setSearchParams(next, { replace: true });
          }
        }}
        showManageAccess={showManageAccess}
        setShowManageAccess={setShowManageAccess}
        showSuspendConfirm={showSuspendConfirm}
        setShowSuspendConfirm={setShowSuspendConfirm}
      />
    </div>
  );
}
