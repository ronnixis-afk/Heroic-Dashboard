export interface ImageAssetFacetRow {
  id: string;
  genre: string;
  assetType: string;
  metadata: Record<string, unknown>;
  tags: string[];
  sizeBytes?: number;
  updatedAt?: string;
}

export interface FacetCacheSnapshot {
  rows: ImageAssetFacetRow[];
  totalStorageBytes: number;
  totalCount: number;
  maxUpdatedAt: string | null;
}

export interface FacetSyncResponse {
  unchanged: boolean;
  snapshot: boolean;
  totalCount: number;
  totalStorageBytes: number;
  maxUpdatedAt: string | null;
  rows: ImageAssetFacetRow[];
  activeIds?: string[];
}

export const EMPTY_FACET_SNAPSHOT: FacetCacheSnapshot = {
  rows: [],
  totalStorageBytes: 0,
  totalCount: 0,
  maxUpdatedAt: null,
};

export interface FacetScope {
  /** When `All` / `Any Genre` / empty, genre is not filtered. */
  genre?: string;
  /** Exact assetType values to include. */
  assetTypes?: string[];
  /** Exact metadata string matches (empty values ignored). */
  metadata?: Record<string, string>;
}

export function expandAssetTypeFilter(assetType: string | undefined): string[] | undefined {
  if (!assetType || assetType === 'All') return undefined;
  return [assetType];
}

export function normalizeAssetTypeCountKey(assetType: string): string {
  return assetType;
}

function getMetadataString(metadata: Record<string, unknown>, key: string): string {
  const value = metadata?.[key];
  return typeof value === 'string' ? value.trim() : '';
}

export function filterFacetRows(
  rows: ImageAssetFacetRow[],
  scope: FacetScope = {}
): ImageAssetFacetRow[] {
  const genre = scope.genre?.trim();
  const filterGenre = Boolean(genre && genre !== 'All' && genre !== 'Any Genre');
  const assetTypes = scope.assetTypes;
  const metadataFilters = Object.entries(scope.metadata || {}).filter(
    ([, value]) => Boolean(value?.trim())
  );

  return rows.filter((row) => {
    // Live matching treats Any Genre as a fallback pool for every specific genre.
    if (filterGenre && row.genre !== genre && row.genre !== 'Any Genre') return false;
    if (assetTypes && assetTypes.length > 0 && !assetTypes.includes(row.assetType)) return false;
    for (const [key, expected] of metadataFilters) {
      if (getMetadataString(row.metadata || {}, key) !== expected.trim()) return false;
    }
    return true;
  });
}

export function countScopedTotal(rows: ImageAssetFacetRow[], scope: FacetScope = {}): number {
  return filterFacetRows(rows, scope).length;
}

export function countByGenre(rows: ImageAssetFacetRow[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key = row.genre || '';
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function countByAssetType(
  rows: ImageAssetFacetRow[],
  scope: FacetScope = {}
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of filterFacetRows(rows, scope)) {
    const key = normalizeAssetTypeCountKey(row.assetType);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function countByMetadataKey(
  rows: ImageAssetFacetRow[],
  metadataKey: string,
  scope: FacetScope = {}
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of filterFacetRows(rows, scope)) {
    const value = getMetadataString(row.metadata || {}, metadataKey);
    if (!value) continue;
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

export function countByTag(
  rows: ImageAssetFacetRow[],
  scope: FacetScope = {}
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const row of filterFacetRows(rows, scope)) {
    for (const tag of row.tags || []) {
      const value = tag?.trim();
      if (!value) continue;
      counts[value] = (counts[value] || 0) + 1;
    }
  }
  return counts;
}

export function formatOptionLabel(label: string, count: number): string {
  return `${label} (${count})`;
}

export function getCount(counts: Record<string, number>, key: string): number {
  if (Object.prototype.hasOwnProperty.call(counts, key)) {
    return counts[key] || 0;
  }
  const lower = key.toLowerCase();
  for (const [entryKey, value] of Object.entries(counts)) {
    if (entryKey.toLowerCase() === lower) return value;
  }
  return 0;
}

function laterTimestamp(left: string | null | undefined, right: string | null | undefined): string | null {
  const leftMs = left ? new Date(left).getTime() : 0;
  const rightMs = right ? new Date(right).getTime() : 0;
  if (!leftMs && !rightMs) return right || left || null;
  return rightMs >= leftMs ? right || null : left || null;
}

export function applyFacetSync(
  cached: FacetCacheSnapshot | null,
  response: FacetSyncResponse
): FacetCacheSnapshot {
  const base = cached ?? EMPTY_FACET_SNAPSHOT;
  if (response.unchanged) {
    return {
      ...base,
      totalStorageBytes: response.totalStorageBytes,
      totalCount: response.totalCount,
      maxUpdatedAt: response.maxUpdatedAt,
    };
  }
  if (response.snapshot) {
    return {
      rows: response.rows.filter((row) => Boolean(row.id)),
      totalStorageBytes: response.totalStorageBytes,
      totalCount: response.totalCount,
      maxUpdatedAt: response.maxUpdatedAt,
    };
  }

  const byId = new Map(base.rows.filter((row) => row.id).map((row) => [row.id, row]));
  for (const row of response.rows) {
    if (row.id) byId.set(row.id, row);
  }
  if (response.activeIds) {
    const keep = new Set(response.activeIds);
    for (const id of [...byId.keys()]) {
      if (!keep.has(id)) byId.delete(id);
    }
  }

  return {
    rows: [...byId.values()],
    totalStorageBytes: response.totalStorageBytes,
    totalCount: response.totalCount,
    maxUpdatedAt: response.maxUpdatedAt,
  };
}

export function needsFacetSnapshotFallback(
  response: FacetSyncResponse,
  merged: FacetCacheSnapshot
): boolean {
  return !response.unchanged && !response.snapshot && merged.rows.length !== response.totalCount;
}

export function buildFacetSyncQuery(cached: FacetCacheSnapshot | null): string {
  if (!cached?.maxUpdatedAt || cached.rows.length === 0) return '';
  const params = new URLSearchParams();
  params.set('since', cached.maxUpdatedAt);
  params.set('knownCount', String(cached.rows.length));
  return params.toString();
}

export function upsertFacetRow(
  snapshot: FacetCacheSnapshot,
  row: ImageAssetFacetRow
): FacetCacheSnapshot {
  if (!row.id) return snapshot;
  const previous = snapshot.rows.find((entry) => entry.id === row.id);
  const rows = snapshot.rows.filter((entry) => entry.id !== row.id);
  rows.push(row);
  return {
    rows,
    totalStorageBytes: Math.max(
      0,
      snapshot.totalStorageBytes - (previous?.sizeBytes || 0) + (row.sizeBytes || 0)
    ),
    totalCount: rows.length,
    maxUpdatedAt: laterTimestamp(snapshot.maxUpdatedAt, row.updatedAt),
  };
}

export function removeFacetRows(
  snapshot: FacetCacheSnapshot,
  ids: string[]
): FacetCacheSnapshot {
  const remove = new Set(ids.filter(Boolean));
  if (remove.size === 0) return snapshot;
  const removedBytes = snapshot.rows.reduce(
    (total, row) => (remove.has(row.id) ? total + (row.sizeBytes || 0) : total),
    0
  );
  const rows = snapshot.rows.filter((row) => !remove.has(row.id));
  return {
    rows,
    totalStorageBytes: Math.max(0, snapshot.totalStorageBytes - removedBytes),
    totalCount: rows.length,
    maxUpdatedAt: snapshot.maxUpdatedAt,
  };
}
