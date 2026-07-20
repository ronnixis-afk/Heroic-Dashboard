/** Legacy NPC rows still stored under older assetType values. */
export const LEGACY_NPC_PORTRAIT_ASSET_TYPES = [
  'NPC Portrait',
  'Humanoid NPC Portrait',
  'Creature NPC Portrait',
] as const;

export interface ImageAssetFacetRow {
  genre: string;
  assetType: string;
  metadata: Record<string, unknown>;
  tags: string[];
}

export interface FacetScope {
  /** When `All` / `Any Genre` / empty, genre is not filtered. */
  genre?: string;
  /** Exact assetType values to include (use expandAssetTypeFilter for NPC). */
  assetTypes?: string[];
  /** Exact metadata string matches (empty values ignored). */
  metadata?: Record<string, string>;
}

export function expandAssetTypeFilter(assetType: string | undefined): string[] | undefined {
  if (!assetType || assetType === 'All') return undefined;
  if (assetType === 'NPC Portrait') {
    return [...LEGACY_NPC_PORTRAIT_ASSET_TYPES];
  }
  return [assetType];
}

export function normalizeAssetTypeCountKey(assetType: string): string {
  if ((LEGACY_NPC_PORTRAIT_ASSET_TYPES as readonly string[]).includes(assetType)) {
    return 'NPC Portrait';
  }
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
    if (filterGenre && row.genre !== genre) return false;
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
