import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';

export type PublicRealmListing = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  genre: string;
  contentRating: string;
  status: 'published' | 'unpublished' | 'hidden';
  authorUserId: string;
  authorName: string;
  playCount: number;
  likeCount: number;
  snapshotVersion: number;
  publishedAt: string;
  updatedAt: string;
  openReportCount: number;
};

export type RealmReport = {
  id: string;
  publicRealmId: string;
  reporterUserId: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  PublicRealm: {
    id: string;
    slug: string;
    title: string;
    status: string;
    authorUserId: string;
    authorName: string;
  };
};

type ListingsResponse = { items: PublicRealmListing[]; total: number };
type ReportsResponse = { items: RealmReport[]; total: number };

export const REPORT_REASON_LABELS: Record<string, string> = {
  inappropriate: 'Inappropriate Content',
  ip_violation: 'IP Violation',
  spam: 'Spam / Misleading',
  other: 'Other',
};

export function usePublicRealms() {
  const { getToken } = useAuth();
  const [listings, setListings] = useState<PublicRealmListing[]>([]);
  const [reports, setReports] = useState<RealmReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const [listingsResult, reportsResult] = await Promise.all([
        fetchRpgAdmin<ListingsResponse>('/api/admin/public-realms?limit=100', getToken),
        fetchRpgAdmin<ReportsResponse>('/api/admin/public-realms/reports?status=open&limit=100', getToken),
      ]);
      setListings(listingsResult.items || []);
      setReports(reportsResult.items || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Load Public Realms.';
      console.error('[PublicRealms] Load error:', err);
      setStatus({ type: 'error', msg: message });
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const setListingStatus = async (id: string, nextStatus: 'hidden' | 'published') => {
    setUpdatingId(id);
    setStatus(null);
    try {
      await fetchRpgAdmin<{ success: boolean }>(`/api/admin/public-realms/${id}`, getToken, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setListings((current) =>
        current.map((l) => (l.id === id ? { ...l, status: nextStatus } : l))
      );
      setStatus({
        type: 'success',
        msg: nextStatus === 'hidden' ? 'Listing Hidden From Catalog.' : 'Listing Restored.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Update Listing.';
      setStatus({ type: 'error', msg: message });
    } finally {
      setUpdatingId(null);
    }
  };

  const setReportStatus = async (id: string, nextStatus: 'resolved' | 'dismissed') => {
    setUpdatingId(id);
    setStatus(null);
    try {
      await fetchRpgAdmin<{ success: boolean }>(
        `/api/admin/public-realms/reports/${id}`,
        getToken,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      setReports((current) => current.filter((r) => r.id !== id));
      setStatus({
        type: 'success',
        msg: nextStatus === 'resolved' ? 'Report Resolved.' : 'Report Dismissed.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Update Report.';
      setStatus({ type: 'error', msg: message });
    } finally {
      setUpdatingId(null);
    }
  };

  const reconcileCounters = async () => {
    setReconciling(true);
    setStatus(null);
    try {
      const result = await fetchRpgAdmin<{
        success: boolean;
        likeRowsCorrected: number;
        playRowsCorrected: number;
      }>('/api/admin/public-realms/reconcile', getToken, { method: 'POST' });
      setStatus({
        type: 'success',
        msg: `Counters Reconciled (${result.likeRowsCorrected} Like Rows, ${result.playRowsCorrected} Play Rows Corrected).`,
      });
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to Reconcile Counters.';
      setStatus({ type: 'error', msg: message });
    } finally {
      setReconciling(false);
    }
  };

  return {
    listings,
    reports,
    loading,
    updatingId,
    reconciling,
    status,
    setStatus,
    reload: load,
    setListingStatus,
    setReportStatus,
    reconcileCounters,
  };
}
