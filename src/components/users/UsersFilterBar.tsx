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
  isExporting
}: UsersFilterBarProps) {
  return (
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
          onClick={handleSyncUsers}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-xl border border-brand-primary bg-brand-surface/50 px-4 py-2.5 text-sm font-bold text-brand-text-muted hover:text-white hover:border-brand-primary/80 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : syncMessage || 'Sync Users'}
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
  );
}
