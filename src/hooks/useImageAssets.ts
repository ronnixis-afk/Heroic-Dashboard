import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export const IMAGE_ASSET_BUCKET = 'dashboard-image-assets';
export const IMAGE_ASSET_PAGE_SIZE = 60;
const REALTIME_INVALIDATE_DEBOUNCE_MS = 5000;
const LEGACY_NPC_PORTRAIT_TYPES = ['NPC Portrait', 'Humanoid NPC Portrait', 'Creature NPC Portrait'];

export const IMAGE_GENRES = ['Any Genre', 'Fantasy', 'Sci-Fi', 'Modern'] as const;
export const IMAGE_ASSET_TYPES = [
  'Character Portrait',
  'NPC Portrait',
  'Monster Portrait',
  'Point Of Interest Image',
  'Zone Image',
  'Item Image',
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

const SELECT_COLUMNS =
  'id,title,description,genre,assetType,tags,metadata,bucketId,objectPath,publicUrl,mimeType,sizeBytes,width,height,uploadedByUserId,createdAt,updatedAt';

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
    case 'NPC Portrait':
      return compactSegments([metadata.race, metadata.gender]);
    case 'Point Of Interest Image':
      return compactSegments([metadata.poiBaseType, metadata.poiModifier]);
    case 'Zone Image':
      return compactSegments([metadata.zoneProperty, metadata.zoneQuality]);
    case 'Item Image':
      return compactSegments([metadata.itemCategory, metadata.itemSubtype]);
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

const getSupabaseForAdmin = async (getToken: (options?: any) => Promise<string | null>) => {
  const token = await getToken({ template: 'supabase' });
  if (!token) {
    throw new Error('Admin Supabase Session Is Required.');
  }
  return getSupabaseClient(token);
};

function escapeIlikeTerm(term: string) {
  return term.replace(/[%_,]/g, '').trim();
}

async function fetchImageAssetsPage(
  getToken: (options?: any) => Promise<string | null>,
  params: ImageAssetsQueryParams
): Promise<ImageAssetsResult> {
  const supabase = await getSupabaseForAdmin(getToken);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? IMAGE_ASSET_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('ImageAsset')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .order('createdAt', { ascending: false })
    .order('id', { ascending: false })
    .range(from, to);

  const genre = params.genre;
  if (genre && genre !== 'All' && genre !== 'Any Genre') {
    query = query.eq('genre', genre);
  }

  const assetType = params.assetType;
  if (assetType && assetType !== 'All') {
    if (assetType === 'NPC Portrait') {
      query = query.in('assetType', LEGACY_NPC_PORTRAIT_TYPES);
    } else {
      query = query.eq('assetType', assetType);
    }
  }

  const tag = params.tag?.trim();
  if (tag && tag !== 'All') {
    query = query.contains('tags', [tag]);
  }

  const searchTerms = (params.search || '')
    .split(/[,\s]+/)
    .map(escapeIlikeTerm)
    .filter(Boolean);

  for (const term of searchTerms) {
    const pattern = `%${term}%`;
    query = query.or(`title.ilike."${pattern}",description.ilike."${pattern}"`);
  }

  const [{ data, error, count }] = await Promise.all([query]);

  if (error) {
    console.error('[MediaLibrary] Fetch image assets failed:', error);
    throw error;
  }

  const assets = (data || []) as ImageAsset[];

  return {
    assets,
    totalCount: count ?? assets.length,
  };
}

async function fetchImageStorageBytes(getToken: (options?: any) => Promise<string | null>) {
  const supabase = await getSupabaseForAdmin(getToken);
  const { data, error } = await supabase.from('ImageAsset').select('sizeBytes');
  if (error) {
    console.warn('[MediaLibrary] Storage totals fetch failed:', error);
    return 0;
  }
  return (data || []).reduce((total, row) => total + (Number(row.sizeBytes) || 0), 0);
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

  const assets = imageAssetResult?.assets ?? [];
  const totalAssetCount = imageAssetResult?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalAssetCount / pageSize));

  useEffect(() => {
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    let cleanup: (() => void) | undefined;
    let isMounted = true;

    const setupSubscription = async () => {
      const supabase = await getSupabaseForAdmin(getToken);
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
    const supabase = await getSupabaseForAdmin(getToken);
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

    const { data, error } = await supabase.from('ImageAsset').insert(record).select().single();

    if (error) {
      await supabase.storage.from(IMAGE_ASSET_BUCKET).remove([objectPath]);
      console.error('[MediaLibrary] Create image asset metadata failed:', error);
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
    return data as ImageAsset;
  };

  const updateImageAsset = async (id: string, input: UpdateImageAssetInput) => {
    const supabase = await getSupabaseForAdmin(getToken);
    const { data, error } = await supabase
      .from('ImageAsset')
      .update({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        genre: input.genre,
        assetType: input.assetType,
        tags: input.tags,
        metadata: input.metadata,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[MediaLibrary] Update image asset failed:', error);
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
    return data as ImageAsset;
  };

  const addTagsToImageAssets = async (selectedAssets: ImageAsset[], tags: string[]) => {
    const normalizedTags = Array.from(new Set(tags.map((tagValue) => tagValue.trim()).filter(Boolean)));
    if (selectedAssets.length === 0 || normalizedTags.length === 0) return;

    const supabase = await getSupabaseForAdmin(getToken);

    await Promise.all(
      selectedAssets.map(async (asset) => {
        const nextTags = Array.from(new Set([...(asset.tags || []), ...normalizedTags]));
        const { error } = await supabase
          .from('ImageAsset')
          .update({
            tags: nextTags,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', asset.id);

        if (error) {
          console.error('[MediaLibrary] Batch tag image asset failed:', error);
          throw error;
        }
      })
    );

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
  };

  const deleteImageAsset = async (asset: ImageAsset) => {
    const supabase = await getSupabaseForAdmin(getToken);
    const { error: removeError } = await supabase.storage
      .from(asset.bucketId || IMAGE_ASSET_BUCKET)
      .remove([asset.objectPath]);

    if (removeError) {
      console.error('[MediaLibrary] Delete image object failed:', removeError);
      throw removeError;
    }

    const { error } = await supabase.from('ImageAsset').delete().eq('id', asset.id);

    if (error) {
      console.error('[MediaLibrary] Delete image asset metadata failed:', error);
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
  };

  const deleteImageAssets = async (selectedAssets: ImageAsset[]) => {
    if (selectedAssets.length === 0) return;

    const supabase = await getSupabaseForAdmin(getToken);
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

    const { error } = await supabase
      .from('ImageAsset')
      .delete()
      .in(
        'id',
        selectedAssets.map((asset) => asset.id)
      );

    if (error) {
      console.error('[MediaLibrary] Batch delete image metadata failed:', error);
      throw error;
    }

    queryClient.invalidateQueries({ queryKey: ['image-assets'] });
  };

  return {
    assets,
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
