import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers, exportUsersCsv, USERS_PAGE_SIZE } from '../../hooks/useUsers';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../lib/AuthContext';
import UsersFilterBar from '../../components/users/UsersFilterBar';
import UsersTable from '../../components/users/UsersTable';
import UserDetailModal from '../../components/users/UserDetailModal';
import { PageHeader, StatCard, StatusBanner } from '../../components/ui';
import { Database, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatBytes } from '../../lib/utils';

const TIER_OPTIONS = ['All', 'newbie', 'adventurer', 'hero', 'super_admin'] as const;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminUsers() {
  const { trackEvent } = useAnalytics();
  const { getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [tier, setTier] = useState('All');
  const [minCredits, setMinCredits] = useState('');
  const [maxCredits, setMaxCredits] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, tier, minCredits, maxCredits, createdAfter, createdBefore]);

  const {
    users,
    totalCount,
    totalPages,
    loading,
    isFetching,
    isSyncing,
    syncMessage,
    syncUsers,
    resolveUserById,
    totalSavesSize,
    totalSavesCount,
    exportParams,
  } = useUsers({
    page,
    pageSize: USERS_PAGE_SIZE,
    search: debouncedSearch,
    tier,
    minCredits: minCredits === '' ? null : Number(minCredits),
    maxCredits: maxCredits === '' ? null : Number(maxCredits),
    createdAfter: createdAfter || null,
    createdBefore: createdBefore ? `${createdBefore}T23:59:59.999Z` : null,
  });

  useEffect(() => {
    const userId = searchParams.get('userId');
    if (!userId || loading) return;

    const match = users.find((user) => user.id === userId);
    if (match) {
      setSelectedUser(match);
      return;
    }

    let cancelled = false;
    void (async () => {
      const user = await resolveUserById(userId);
      if (!cancelled && user) setSelectedUser(user);
    })();
    return () => {
      cancelled = true;
    };
    // resolveUserById is stable enough via getToken; intentionally omit to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, users, loading]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportMessage(null);
    trackEvent('export_records_clicked');
    try {
      const csv = await exportUsersCsv(() => getToken({ template: 'supabase' }), exportParams);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `heroic-users-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setExportMessage('Exported Current Filter Results (Up To 2,000 Rows).');
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      console.error('[AdminUsers] Export failed:', err);
      setExportMessage('Export Failed. Please Try Again.');
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncUsers = () => {
    trackEvent('sync_users_clicked');
    syncUsers();
  };

  return (
    <div className="page">
      <PageHeader
        title="User Management"
        description="Search, sync, and inspect player accounts and cloud save usage."
      />

      {syncMessage && (
        <StatusBanner
          type={
            syncMessage.toLowerCase().includes('fail') || syncMessage.toLowerCase().includes('error')
              ? 'error'
              : 'success'
          }
          message={syncMessage}
        />
      )}

      {exportMessage && (
        <StatusBanner
          type={exportMessage.toLowerCase().includes('fail') ? 'error' : 'success'}
          message={exportMessage}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="input-label" htmlFor="filter-tier">
                  Tier
                </label>
                <select
                  id="filter-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="input-field"
                >
                  {TIER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === 'All'
                        ? 'All Tiers'
                        : option
                            .split('_')
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label" htmlFor="filter-min-credits">
                  Min Credits
                </label>
                <input
                  id="filter-min-credits"
                  type="number"
                  min={0}
                  value={minCredits}
                  onChange={(e) => setMinCredits(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label" htmlFor="filter-max-credits">
                  Max Credits
                </label>
                <input
                  id="filter-max-credits"
                  type="number"
                  min={0}
                  value={maxCredits}
                  onChange={(e) => setMaxCredits(e.target.value)}
                  placeholder="Any"
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label" htmlFor="filter-created-after">
                  Registered After
                </label>
                <input
                  id="filter-created-after"
                  type="date"
                  value={createdAfter}
                  onChange={(e) => setCreatedAfter(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="input-label" htmlFor="filter-created-before">
                  Registered Before
                </label>
                <input
                  id="filter-created-before"
                  type="date"
                  value={createdBefore}
                  onChange={(e) => setCreatedBefore(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UsersTable
        filteredUsers={users}
        setSelectedUser={setSelectedUser}
        isLoading={loading}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="help-text">
          {totalCount.toLocaleString()} Users
          {isFetching && !loading ? ' · Refreshing…' : ''}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft size={12} />
            Previous
          </button>
          <span className="text-xs text-brand-text-muted tabular-nums">
            Page {page} Of {totalPages}
          </span>
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      <UserDetailModal
        selectedUser={selectedUser}
        handleCloseModal={() => {
          setSelectedUser(null);
          if (searchParams.has('userId')) {
            const next = new URLSearchParams(searchParams);
            next.delete('userId');
            setSearchParams(next, { replace: true });
          }
        }}
      />
    </div>
  );
}
