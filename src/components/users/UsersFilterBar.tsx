import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UsersFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  isSyncing: boolean;
  syncMessage: string;
  handleSyncUsers: () => void;
  handleExport: () => void;
  isExporting: boolean;
}

export default function UsersFilterBar({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  isSyncing,
  syncMessage,
  handleSyncUsers,
  handleExport,
  isExporting,
}: UsersFilterBarProps) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-sm group">
        <Search
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted group-focus-within:text-brand-accent transition-colors"
          size={14}
        />
        <input
          type="text"
          placeholder="Search by email or UID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field !pl-8"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'btn-secondary btn-sm',
            showFilters && 'border-brand-accent/50 text-brand-accent bg-brand-accent/10'
          )}
        >
          <Filter size={12} />
          Filters
        </button>
        <button
          onClick={handleSyncUsers}
          disabled={isSyncing}
          className="btn-secondary btn-sm"
        >
          <RefreshCw size={12} className={cn(isSyncing && 'animate-spin')} />
          {isSyncing ? 'Syncing...' : 'Sync Users'}
        </button>
        <button onClick={handleExport} disabled={isExporting} className="btn-primary btn-sm">
          {isExporting ? 'Exporting...' : 'Export'}
        </button>
      </div>
    </div>
  );
}
