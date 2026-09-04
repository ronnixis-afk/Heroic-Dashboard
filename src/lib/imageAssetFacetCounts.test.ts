import { describe, expect, it } from 'vitest';
import {
  applyFacetSync,
  buildFacetSyncQuery,
  countByAssetType,
  EMPTY_FACET_SNAPSHOT,
  FacetCacheSnapshot,
  FacetSyncResponse,
  filterFacetRows,
  ImageAssetFacetRow,
  needsFacetSnapshotFallback,
  removeFacetRows,
  upsertFacetRow,
} from './imageAssetFacetCounts';

const row = (
  id: string,
  extras: Partial<ImageAssetFacetRow> = {}
): ImageAssetFacetRow => ({
  id,
  genre: 'Fantasy',
  assetType: 'Character Portrait',
  metadata: { race: 'Human' },
  tags: [],
  sizeBytes: 1000,
  updatedAt: '2026-08-31T12:00:00.000Z',
  ...extras,
});

const snapshot = (
  rows: ImageAssetFacetRow[],
  extras: Partial<FacetCacheSnapshot> = {}
): FacetCacheSnapshot => ({
  rows,
  totalStorageBytes: rows.reduce((sum, item) => sum + (item.sizeBytes || 0), 0),
  totalCount: rows.length,
  maxUpdatedAt: rows.at(-1)?.updatedAt || '2026-08-31T12:00:00.000Z',
  ...extras,
});

const sync = (overrides: Partial<FacetSyncResponse>): FacetSyncResponse => ({
  unchanged: false,
  snapshot: false,
  totalCount: 0,
  totalStorageBytes: 0,
  maxUpdatedAt: '2026-08-31T12:00:00.000Z',
  rows: [],
  ...overrides,
});

describe('applyFacetSync', () => {
  it('keeps cached rows when the server reports unchanged', () => {
    const cached = snapshot([row('a'), row('b')]);
    const next = applyFacetSync(
      cached,
      sync({ unchanged: true, totalCount: 2, totalStorageBytes: 2000 })
    );
    expect(next.rows.map((item) => item.id)).toEqual(['a', 'b']);
    expect(next.totalStorageBytes).toBe(2000);
    expect(next.totalCount).toBe(2);
  });

  it('replaces the cache on a full snapshot', () => {
    const cached = snapshot([row('old')]);
    const next = applyFacetSync(
      cached,
      sync({
        snapshot: true,
        totalCount: 1,
        totalStorageBytes: 1000,
        rows: [row('new')],
      })
    );
    expect(next.rows.map((item) => item.id)).toEqual(['new']);
  });

  it('upserts changed rows without dropping the rest', () => {
    const cached = snapshot([row('a'), row('b', { sizeBytes: 500 })]);
    const next = applyFacetSync(
      cached,
      sync({
        totalCount: 2,
        totalStorageBytes: 2500,
        rows: [row('b', { sizeBytes: 1500, metadata: { race: 'Elf' } })],
      })
    );
    expect(next.rows).toHaveLength(2);
    expect(next.rows.find((item) => item.id === 'b')?.metadata.race).toBe('Elf');
    expect(next.totalStorageBytes).toBe(2500);
  });

  it('prunes deleted ids when activeIds are provided', () => {
    const cached = snapshot([row('a'), row('b'), row('c')]);
    const next = applyFacetSync(
      cached,
      sync({
        totalCount: 2,
        totalStorageBytes: 2000,
        rows: [],
        activeIds: ['a', 'c'],
      })
    );
    expect(next.rows.map((item) => item.id).sort()).toEqual(['a', 'c']);
  });

  it('clears the cache when the library is emptied', () => {
    const cached = snapshot([row('a'), row('b')]);
    const next = applyFacetSync(
      cached,
      sync({
        totalCount: 0,
        totalStorageBytes: 0,
        maxUpdatedAt: null,
        rows: [],
        activeIds: [],
      })
    );
    expect(next.rows).toEqual([]);
    expect(next.totalCount).toBe(0);
  });

  it('heals a future client watermark without dropping rows', () => {
    const cached = snapshot([row('a')], {
      maxUpdatedAt: '2026-08-31T18:00:00.000Z',
    });
    const next = applyFacetSync(
      cached,
      sync({
        totalCount: 1,
        totalStorageBytes: 1000,
        maxUpdatedAt: '2026-08-31T12:00:00.000Z',
        rows: [],
      })
    );
    expect(next.rows).toHaveLength(1);
    expect(next.maxUpdatedAt).toBe('2026-08-31T12:00:00.000Z');
  });
});

describe('needsFacetSnapshotFallback', () => {
  it('falls back when insert+delete keep the same count but change identity', () => {
    const cached = snapshot([row('a'), row('b')]);
    const response = sync({
      totalCount: 2,
      totalStorageBytes: 2000,
      rows: [row('c', { updatedAt: '2026-08-31T13:00:00.000Z' })],
    });
    const merged = applyFacetSync(cached, response);
    expect(merged.rows.map((item) => item.id).sort()).toEqual(['a', 'b', 'c']);
    expect(needsFacetSnapshotFallback(response, merged)).toBe(true);
  });

  it('does not fall back after a clean insert', () => {
    const cached = snapshot([row('a')]);
    const response = sync({
      totalCount: 2,
      totalStorageBytes: 2000,
      rows: [row('b')],
    });
    const merged = applyFacetSync(cached, response);
    expect(merged.rows).toHaveLength(2);
    expect(needsFacetSnapshotFallback(response, merged)).toBe(false);
  });

  it('does not fall back for unchanged or snapshot responses', () => {
    const cached = snapshot([row('a')]);
    expect(
      needsFacetSnapshotFallback(
        sync({ unchanged: true, totalCount: 1 }),
        applyFacetSync(cached, sync({ unchanged: true, totalCount: 1 }))
      )
    ).toBe(false);
    expect(
      needsFacetSnapshotFallback(
        sync({ snapshot: true, totalCount: 1, rows: [row('z')] }),
        applyFacetSync(cached, sync({ snapshot: true, totalCount: 1, rows: [row('z')] }))
      )
    ).toBe(false);
  });
});

describe('filterFacetRows genre scope', () => {
  const rows = [
    row('fantasy', { genre: 'Fantasy', assetType: 'Monster Portrait' }),
    row('any', { genre: 'Any Genre', assetType: 'Monster Portrait' }),
    row('scifi', { genre: 'Sci-Fi', assetType: 'Monster Portrait' }),
    row('item', { genre: 'Fantasy', assetType: 'Item Image' }),
  ];

  it('includes Any Genre assets when scoped to a specific genre', () => {
    expect(filterFacetRows(rows, { genre: 'Fantasy' }).map((item) => item.id).sort()).toEqual([
      'any',
      'fantasy',
      'item',
    ]);
    expect(countByAssetType(rows, { genre: 'Fantasy' })).toEqual({
      'Monster Portrait': 2,
      'Item Image': 1,
    });
  });

  it('does not mix other specific genres into the selected genre', () => {
    expect(filterFacetRows(rows, { genre: 'Sci-Fi' }).map((item) => item.id).sort()).toEqual([
      'any',
      'scifi',
    ]);
  });

  it('does not filter when the scope is All or Any Genre', () => {
    expect(filterFacetRows(rows, { genre: 'All' })).toHaveLength(4);
    expect(filterFacetRows(rows, { genre: 'Any Genre' })).toHaveLength(4);
  });
});

describe('buildFacetSyncQuery', () => {
  it('omits a watermark when the cache is empty', () => {
    expect(buildFacetSyncQuery(null)).toBe('');
    expect(buildFacetSyncQuery(EMPTY_FACET_SNAPSHOT)).toBe('');
  });

  it('sends the actual cached row count, including zero-safe totals', () => {
    const query = buildFacetSyncQuery(
      snapshot([row('a'), row('b')], { totalCount: 0, maxUpdatedAt: '2026-08-31T12:00:00.000Z' })
    );
    expect(query).toContain('knownCount=2');
    expect(query).toContain('since=2026-08-31T12%3A00%3A00.000Z');
  });
});

describe('upsertFacetRow and removeFacetRows', () => {
  it('adds a row and updates storage', () => {
    const next = upsertFacetRow(snapshot([row('a')]), row('b', { sizeBytes: 2500 }));
    expect(next.rows).toHaveLength(2);
    expect(next.totalStorageBytes).toBe(3500);
    expect(next.totalCount).toBe(2);
  });

  it('replaces an existing row without duplicating it', () => {
    const next = upsertFacetRow(
      snapshot([row('a', { sizeBytes: 1000 })]),
      row('a', { sizeBytes: 4000, metadata: { race: 'Dwarf' } })
    );
    expect(next.rows).toHaveLength(1);
    expect(next.totalStorageBytes).toBe(4000);
    expect(next.rows[0].metadata.race).toBe('Dwarf');
  });

  it('does not advance the watermark when updatedAt is omitted', () => {
    const cached = snapshot([row('a')], { maxUpdatedAt: '2026-08-31T12:00:00.000Z' });
    const next = upsertFacetRow(cached, {
      ...row('a'),
      tags: ['new'],
      updatedAt: undefined,
    });
    expect(next.maxUpdatedAt).toBe('2026-08-31T12:00:00.000Z');
    expect(next.rows[0].tags).toEqual(['new']);
  });

  it('removes rows and storage bytes', () => {
    const next = removeFacetRows(snapshot([row('a', { sizeBytes: 1000 }), row('b', { sizeBytes: 3000 })]), [
      'b',
    ]);
    expect(next.rows.map((item) => item.id)).toEqual(['a']);
    expect(next.totalStorageBytes).toBe(1000);
    expect(next.totalCount).toBe(1);
    expect(next.maxUpdatedAt).toBe('2026-08-31T12:00:00.000Z');
  });
});
