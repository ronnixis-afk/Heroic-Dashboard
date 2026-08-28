import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ImageAssetFacetRow,
} from '../lib/imageAssetFacetCounts';
import { getAdminSupabase } from '../lib/getAdminSupabase';
import { fetchRpgAdmin } from '../lib/rpgAdminApi';
import { useAuth } from '../lib/AuthContext';

export const IMAGE_ASSET_BUCKET = 'dashboard-image-assets';
export const IMAGE_ASSET_PAGE_SIZE = 60;
/** Page size for facet/storage totals so the full library is covered. */
const IMAGE_ASSET_FACET_PAGE_SIZE = 1000;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;

export const IMAGE_GENRES = ['Any Genre', 'Fantasy', 'Sci-Fi', 'Modern'] as const;
export const IMAGE_ASSET_TYPES = [
  'Character Portrait',
  'Monster Portrait',
  'Mount Portrait',
  'Vehicle Portrait',
  'Ship Portrait',
  'Point Of Interest Image',
  'Zone Image',
  'Item Image',
  'Power Image',
  'Origin Item',
  'App Assets',
] as const;

export type ImageGenre = (typeof IMAGE_GENRES)[number];
export type ImageAssetType = (typeof IMAGE_ASSET_TYPES)[number];

export interface ImageAsset {
  id: string;
  title: string;
  description: string | null;
  genre: ImageGenre;
  assetType: ImageAssetType;
  tags: string[];
  metadata: Record<string, unknown>;
  bucketId: string;
  objectPath: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  uploadedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImageAssetsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  genre?: string;
  assetType?: string;
  tag?: string;
}

interface ImageAssetsResult {
  assets: ImageAsset[];
  totalCount: number;
}

export interface ImageAssetInput {
  title: string;
  description?: string;
  genre: ImageGenre;
  assetType: ImageAssetType;
  tags: string[];
  metadata: Record<string, string>;
}

export interface CreateImageAssetInput extends ImageAssetInput {
  blob: Blob;
  sizeBytes: number;
  width: number;
  height: number;
}

export type UpdateImageAssetInput = ImageAssetInput;

const normalizeFolderName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const compactSegments = (segments: Array<string | undefined>) =>
  segments.map((segment) => (segment ? normalizeFolderName(segment) : '')).filter(Boolean);

const getMetadataPathSegments = (input: ImageAssetInput) => {
  const metadata = input.metadata || {};

  switch (input.assetType) {
    case 'Character Portrait':
      return compactSegments([metadata.race, metadata.gender]);
    case 'Mount Portrait':
      return compactSegments([metadata.mountType]);
    case 'Vehicle Portrait':
      return compactSegments([metadata.vehicleType]);
    case 'Ship Portrait':
      return compactSegments([metadata.shipType]);
    case 'Point Of Interest Image':
      return compactSegments([metadata.poiBaseType, metadata.poiModifier]);
    case 'Zone Image':
      return compactSegments([metadata.terrainType]);
    case 'Item Image':
      return compactSegments([metadata.itemCategory, metadata.itemSubtype]);
    case 'Power Image':
      return compactSegments([metadata.powerCategory, metadata.powerSubtype]);
    case 'Origin Item':
      return compactSegments([metadata.startingStoryId]);
    case 'Monster Portrait':
      return compactSegments([metadata.monsterType, metadata.monsterSubtype]);
    default:
      return [];
  }
};

const getImageObjectPath = (input: ImageAssetInput, id: string) => {
  const titleSlug = normalizeFolderName(input.title) || 'image';
  const fileName = `${titleSlug}-${id}.webp`;

  return [
    normalizeFolderName(input.genre),
    normalizeFolderName(input.assetType),
    ...getMetadataPathSegments(input),
    fileName,
  ].join('/');
};

const getAssetId = () => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

function buildImageAssetsQuery(params: ImageAssetsQueryParams): string {
  const searchParams = new URLSearchParams();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? IMAGE_ASSET_PAGE_SIZE;
  searchParams.set('page', String(page));
  searchParams.set('pageSize', String(pageSize));

  if (params.search?.trim()) searchParams.set('search', params.search.trim());
  if (params.genre && params.genre !== 'All' && params.genre !== 'Any Genre') {
    searchParams.set('genre', params.genre);
  }
  if (params.assetType && params.assetType !== 'All') {
    searchParams.set('assetType', params.assetType);
  }
  if (params.tag?.trim() && params.tag !== 'All') {
    searchParams.set('tag', params.tag.trim());
  }

  return searchParams.toString();
}

async function fetchImageAssetsPage(
  getToken: (options?: any) => Promise<string | null>,
  params: ImageAssetsQueryParams
): Promise<ImageAssetsResult> {
  const query = buildImageAssetsQuery(params);
  const result = await fetchRpgAdmin<{ assets?: ImageAsset[]; totalCount?: number }>(
    `/api/admin/image-assets?${query}`,
    getToken
  );

  const assets = result.assets || [];
  return {
    assets,
    totalCount: result.totalCount ?? assets.length,
  };
}

async function fetchAllImageAssetRows<T>(
  getToken: (options?: any) => Promise<string | null>,
  mapRow: (asset: ImageAsset) => T
): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;

  while (true) {
    const result = await fetchImageAssetsPage(getToken, {
      page,
      pageSize: IMAGE_ASSET_FACET_PAGE_SIZE,
    });
    rows.push(...result.assets.map(mapRow));

    if (result.assets.length < IMAGE_ASSET_FACET_PAGE_SIZE) break;
    if (rows.length >= (result.totalCount || 0) && result.totalCount > 0) break;
    page += 1;
  }

  return rows;
}

async function fetchImageStorageBytes(getToken: (options?: any) => Promise<string | null>) {
  try {
    const rows = await fetchAllImageAssetRows(getToken, (asset) => Number(asset.sizeBytes) || 0);
    return rows.reduce((total, sizeBytes) => total + sizeBytes, 0);
  } catch (error) {
    console.warn('[MediaLibrary] Storage totals fetch failed:', error);
    return 0;
  }
}

async function fetchImageAssetFacets(
  getToken: (options?: any) => Promise<string | null>
): Promise<ImageAssetFacetRow[]> {
  try {
    return await fetchAllImageAssetRows(getToken, (asset) => ({
      genre: String(asset.genre || ''),
      assetType: String(asset.assetType || ''),
      metadata: (asset.metadata && typeof asset.metadata === 'object'
        ? asset.metadata
        : {}) as Record<string, unknown>,
      tags: Array.isArray(asset.tags) ? asset.tags.map(String) : [],
    }));
  } catch (error) {
    console.warn('[MediaLibrary] Facet fetch failed:', error);
    return [];
  }
}

export function useImageAssets(params: ImageAssetsQueryParams = {}) {
  const queryClient = useQueryClient();
  const { getToken, user } = useAuth();

  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? IMAGE_ASSET_PAGE_SIZE;
  const search = params.search?.trim() || '';
  const genre = params.genre || 'All';
  const assetType = params.assetType || 'All';
  const tag = params.tag || 'All';

  const listQueryKey = ['image-assets', { page, pageSize, search, genre, assetType, tag }] as const;

  const { data: imageAssetResult, isLoading: loading, isFetching } = useQuery({
    queryKey: listQueryKey,
    queryFn: () =>
      fetchImageAssetsPage(getToken, { page, pageSize, search, genre, assetType, tag }),
    placeholderData: (previous) => previous,
  });

  const { data: totalStorageBytes = 0 } = useQuery({
    queryKey: ['image-assets', 'storage-bytes'],
    queryFn: () => fetchImageStorageBytes(getToken),
    staleTime: 1000 * 60 * 5,
  });

  const { data: facetRows = [] } = useQuery({
    queryKey: ['image-assets', 'facets'],
    queryFn: () => fetchImageAssetFacets(getToken),
    staleTime: 1000 * 60 * 5,
  });

  const assets = imageAssetResult?.assets ?? [];
  const totalAssetCount = imageAssetResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalAssetCount / pageSize));

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const supabase = await getAdminSupabase(getToken);
      const subscription = supabase
        .channel('public:ImageAsset')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ImageAsset' }, () => {
          if (invalidateTimer) clearTimeout(invalidateTimer);
          invalidateTimer = setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['image-assets'] });
          }, REALTIME_INVALIDATE_DEBOUNCE_MS);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    setupSubscription()
      .then((result) => {
        if (isMounted) {
          cleanup = result;
        } else {
          result?.();
        }
      })
      .catch((error) => console.error('[MediaLibrary] Real-time setup failed:', error));

    return () => {
      isMounted = false;
      if (invalidateTimer) clearTimeout(invalidateTimer);
      cleanup?.();
    };
  }, [queryClient, getToken]);

  const createImageAsset = async (input: CreateImageAssetInput) => {
    const supabase = await getAdminSupabase(getToken);
    const id = getAssetId();
    const objectPath = getImageObjectPath(input, id);

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_ASSET_BUCKET)
      .upload(objectPath, input.blob, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      console.error('[MediaLibrary] Upload image asset failed:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from(IMAGE_ASSET_BUCKET)
      .getPublicUrl(objectPath);

    const record = {
      id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      genre: input.genre,
      assetType: input.assetType,
      tags: input.tags,
      metadata: input.metadata,
      bucketId: IMAGE_ASSET_BUCKET,
      objectPath,
      publicUrl: publicUrlData.publicUrl,
      mimeType: 'image/webp',
      sizeBytes: input.sizeBytes,
      width: input.width,
      height: input.height,
      uploadedByUserId: user?.id || null,
    };

    try {
      const data = await fetchRpgAdmin<{ asset?: ImageAsset } | ImageAsset>(
        '/api/admin/image-assets',
        getToken,
        {
          method: 'POST',
          body: JSON.stringify(record),
        }
      );
      queryClient.invalidateQueries({ queryKey: ['image-assets'] });
      return (('asset' in (data as object) ? (data as { asset: ImageAsset }).asset : data) as ImageAsset);
    } catch (error) {
      await supabase.storage.from(IMAGE_ASSET_BUCKET).remove([objectPath]);
      console.error('[MediaLibrary] Create image asset metadata failed:', error);
      throw error;
    }
  };

  const updateImageAsset = async (id: string, input: UpdateImageAssetInput) => {
    const data = await fetchRpgAdmin<{ asset?: ImageAsset } | ImageAsset>(
      `/api/admin/image-assets/${id}`,
      getToken,
      {
        method: 'PATCH',
        body: JSON.stringify({
          title: input.title.trim(),
          description: input.description?.trim() || null,
          genre: input.genre,
          assetType: input.assetType,
          tags: input.tags,
          metadata: input.metadata,
        }),
      }
    );

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
    return (('asset' in (data as object) ? (data as { asset: ImageAsset }).asset : data) as ImageAsset);
  };

  const addTagsToImageAssets = async (selectedAssets: ImageAsset[], tags: string[]) => {
    const normalizedTags = Array.from(new Set(tags.map((tagValue) => tagValue.trim()).filter(Boolean)));
    if (selectedAssets.length === 0 || normalizedTags.length === 0) return;

    await Promise.all(
      selectedAssets.map(async (asset) => {
        const nextTags = Array.from(new Set([...(asset.tags || []), ...normalizedTags]));
        await fetchRpgAdmin(`/api/admin/image-assets/${asset.id}`, getToken, {
          method: 'PATCH',
          body: JSON.stringify({ tags: nextTags }),
        });
      })
    );

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
  };

  const deleteImageAsset = async (asset: ImageAsset) => {
    const supabase = await getAdminSupabase(getToken);
    const { error: removeError } = await supabase.storage
      .from(asset.bucketId || IMAGE_ASSET_BUCKET)
      .remove([asset.objectPath]);

    if (removeError) {
      console.error('[MediaLibrary] Delete image object failed:', removeError);
      throw removeError;
    }

    await fetchRpgAdmin(`/api/admin/image-assets/${asset.id}`, getToken, {
      method: 'DELETE',
    });

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
  };

  const deleteImageAssets = async (selectedAssets: ImageAsset[]) => {
    if (selectedAssets.length === 0) return;

    const supabase = await getAdminSupabase(getToken);
    const assetsByBucket = selectedAssets.reduce<Record<string, string[]>>((groups, asset) => {
      const bucketId = asset.bucketId || IMAGE_ASSET_BUCKET;
      groups[bucketId] = [...(groups[bucketId] || []), asset.objectPath];
      return groups;
    }, {});

    await Promise.all(
      Object.entries(assetsByBucket).map(async ([bucketId, objectPaths]) => {
        const { error } = await supabase.storage.from(bucketId).remove(objectPaths);
        if (error) {
          console.error('[MediaLibrary] Batch delete image objects failed:', error);
          throw error;
        }
      })
    );

    await Promise.all(
      selectedAssets.map((asset) =>
        fetchRpgAdmin(`/api/admin/image-assets/${asset.id}`, getToken, {
          method: 'DELETE',
        })
      )
    );

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
  };

  return {
    assets,
    facetRows,
    totalAssetCount,
    totalStorageBytes,
    totalPages,
    page,
    pageSize,
    loading,
    isFetching,
    createImageAsset,
    updateImageAsset,
    addTagsToImageAssets,
    deleteImageAsset,
    deleteImageAssets,
  };
}
