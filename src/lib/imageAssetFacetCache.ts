import {
  EMPTY_FACET_SNAPSHOT,
  FacetCacheSnapshot,
  ImageAssetFacetRow,
} from './imageAssetFacetCounts';

const STORAGE_KEY = 'heroic.admin.imageAssetFacets.v1';

function isValidRow(row: ImageAssetFacetRow): boolean {
  return Boolean(row?.id);
}

export function readFacetCache(): FacetCacheSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FacetCacheSnapshot>;
    if (!Array.isArray(parsed.rows) || parsed.rows.some((row) => !isValidRow(row))) {
      return null;
    }
    return {
      rows: parsed.rows,
      totalStorageBytes: Number(parsed.totalStorageBytes) || 0,
      totalCount: Number.isFinite(Number(parsed.totalCount))
        ? Number(parsed.totalCount)
        : parsed.rows.length,
      maxUpdatedAt: parsed.maxUpdatedAt || null,
    };
  } catch (error) {
    console.warn('[MediaLibrary] Unable To Read Cached Image Counts:', error);
    return null;
  }
}

export function writeFacetCache(snapshot: FacetCacheSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[MediaLibrary] Unable To Cache Image Counts:', error);
  }
}

export function emptyFacetSnapshot(): FacetCacheSnapshot {
  return { ...EMPTY_FACET_SNAPSHOT, rows: [] };
}
