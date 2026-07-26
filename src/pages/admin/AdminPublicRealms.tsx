import { useState } from 'react';
import { Globe, Flag, RefreshCw, EyeOff, Eye, Loader2, ExternalLink } from 'lucide-react';
import { PageHeader, StatusBanner, EmptyState, PageLoader } from '../../components/ui';
import { cn } from '../../lib/utils';
import {
  REPORT_REASON_LABELS,
  usePublicRealms,
  type PublicRealmListing,
} from '../../hooks/usePublicRealms';

const RPG_APP_URL = (import.meta.env.VITE_RPG_API_URL || '').replace(/\/$/, '');

const statusBadgeClass = (status: PublicRealmListing['status']) => {
  switch (status) {
    case 'published':
      return 'badge-success';
    case 'hidden':
      return 'badge-danger';
    default:
      return 'badge-muted';
  }
};

export default function AdminPublicRealms() {
  const {
    listings,
    reports,
    loading,
    updatingId,
    reconciling,
    status,
    setStatus,
    reload,
    setListingStatus,
    setReportStatus,
    reconcileCounters,
  } = usePublicRealms();

  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished' | 'hidden'>('all');

  const filteredListings =
    statusFilter === 'all' ? listings : listings.filter((l) => l.status === statusFilter);

  if (loading) {
    return (
      <div className="page">
        <PageHeader
          title="Public Realms"
          description="Moderate community-shared realms and review user reports."
        />
        <div className="flex min-h-[40vh] items-center justify-center">
          <PageLoader label="Loading Public Realms" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Public Realms"
        description="Moderate community-shared realms and review user reports. Hiding a listing removes it from the catalog without deleting player copies."
        actions={
          <>
            <button
              type="button"
              onClick={() => void reload()}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void reconcileCounters()}
              disabled={reconciling}
              className="btn-secondary flex items-center gap-2"
              title="Recompute Play And Like Counters From Fact Tables"
            >
              {reconciling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Reconcile Counters
            </button>
          </>
        }
      />

      {status && (
        <StatusBanner type={status.type} message={status.msg} onDismiss={() => setStatus(null)} />
      )}

      {/* Report Queue */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="h-4 w-4 text-brand-accent" />
          <h2 className="text-header font-semibold m-0">Open Reports</h2>
          <span className="badge-muted">{reports.length}</span>
        </div>

        {reports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No Open Reports"
            description="User reports against public realms will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[760px]">
              <thead>
                <tr>
                  <th>Reported</th>
                  <th>Realm</th>
                  <th>Author</th>
                  <th>Reason</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="text-brand-text-muted whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-medium">{report.PublicRealm.title}</span>
                      <span
                        className={cn('ml-2', statusBadgeClass(report.PublicRealm.status as PublicRealmListing['status']))}
                      >
                        {report.PublicRealm.status}
                      </span>
                    </td>
                    <td className="text-brand-text-muted">{report.PublicRealm.authorName}</td>
                    <td>{REPORT_REASON_LABELS[report.reason] || report.reason}</td>
                    <td className="max-w-[240px] truncate text-brand-text-muted" title={report.details}>
                      {report.details || '—'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {report.PublicRealm.status === 'published' && (
                          <button
                            type="button"
                            onClick={() => void setListingStatus(report.PublicRealm.id, 'hidden')}
                            disabled={updatingId === report.PublicRealm.id}
                            className="btn-secondary flex items-center gap-1.5 text-red-400"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                            Hide Realm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void setReportStatus(report.id, 'resolved')}
                          disabled={updatingId === report.id}
                          className="btn-secondary"
                        >
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => void setReportStatus(report.id, 'dismissed')}
                          disabled={updatingId === report.id}
                          className="btn-secondary text-brand-text-muted"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Listings */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-accent" />
            <h2 className="text-header font-semibold m-0">Listings</h2>
            <span className="badge-muted">{filteredListings.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {(['all', 'published', 'unpublished', 'hidden'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  'btn-secondary capitalize',
                  statusFilter === filter && 'border-brand-accent text-brand-accent'
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No Listings"
            description="Community-published realms will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Genre</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Plays</th>
                  <th>Likes</th>
                  <th>Reports</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((listing) => (
                  <tr key={listing.id}>
                    <td>
                      <span className="font-medium">{listing.title}</span>
                      {listing.tagline && (
                        <p className="text-xs text-brand-text-muted m-0 max-w-[220px] truncate" title={listing.tagline}>
                          {listing.tagline}
                        </p>
                      )}
                    </td>
                    <td className="text-brand-text-muted">{listing.authorName}</td>
                    <td>{listing.genre}</td>
                    <td>
                      <span className={listing.contentRating === 'mature' ? 'badge-danger' : 'badge-muted'}>
                        {listing.contentRating === 'mature' ? '18+' : 'PG-13'}
                      </span>
                    </td>
                    <td>
                      <span className={statusBadgeClass(listing.status)}>{listing.status}</span>
                    </td>
                    <td>{listing.playCount.toLocaleString()}</td>
                    <td>{listing.likeCount.toLocaleString()}</td>
                    <td>
                      {listing.openReportCount > 0 ? (
                        <span className="badge-danger">{listing.openReportCount}</span>
                      ) : (
                        <span className="text-brand-text-muted">0</span>
                      )}
                    </td>
                    <td className="text-brand-text-muted whitespace-nowrap">
                      {new Date(listing.updatedAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {RPG_APP_URL && listing.status === 'published' && (
                          <a
                            href={`${RPG_APP_URL}/realms/${listing.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-icon"
                            title="Open Public Listing"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {listing.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => void setListingStatus(listing.id, 'hidden')}
                            disabled={updatingId === listing.id}
                            className="btn-secondary flex items-center gap-1.5 text-red-400"
                          >
                            {updatingId === listing.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5" />
                            )}
                            Hide
                          </button>
                        ) : listing.status === 'hidden' ? (
                          <button
                            type="button"
                            onClick={() => void setListingStatus(listing.id, 'published')}
                            disabled={updatingId === listing.id}
                            className="btn-secondary flex items-center gap-1.5"
                          >
                            {updatingId === listing.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                            Restore
                          </button>
                        ) : (
                          <span className="text-xs text-brand-text-muted">Author Unpublished</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
