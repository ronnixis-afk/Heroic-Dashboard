import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export const IMAGE_ASSET_BUCKET = 'dashboard-image-assets';

export const IMAGE_GENRES = ['Any Genre', 'Fantasy', 'Sci-Fi', 'Modern'] as const;
export const IMAGE_ASSET_TYPES = [
  'Character Portrait',
  'NPC Portrait',
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
    case 'NPC Portrait':
      return compactSegments([metadata.race, metadata.gender]);
    case 'Point Of Interest Image':
      return compactSegments([metadata.poiBaseType, metadata.poiModifier]);
    case 'Zone Image':
      return compactSegments([metadata.zoneProperty, metadata.zoneQuality]);
    case 'Item Image':
      return compactSegments([metadata.itemCategory, metadata.itemSubtype]);
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

async function fetchImageAssets(getToken: (options?: any) => Promise<string | null>): Promise<ImageAssetsResult> {
  const supabase = await getSupabaseForAdmin(getToken);
  const { data, error, count } = await supabase
    .from('ImageAsset')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false });

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

export function useImageAssets() {
  const queryClient = useQueryClient();
  const { getToken, user } = useAuth();

  const { data: imageAssetResult, isLoading: loading } = useQuery({
    queryKey: ['image-assets'],
    queryFn: () => fetchImageAssets(getToken),
  });
  const assets = imageAssetResult?.assets ?? [];
  const totalAssetCount = imageAssetResult?.totalCount ?? assets.length;

  useEffect(() => {
    let subscription: any;

    const setupSubscription = async () => {
      try {
        const supabase = await getSupabaseForAdmin(getToken);
        subscription = supabase
          .channel('public:ImageAsset')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ImageAsset' }, () => {
            queryClient.invalidateQueries({ queryKey: ['image-assets'] });
          })
          .subscribe();
      } catch (error) {
        console.error('[MediaLibrary] Real-time setup failed:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        getSupabaseForAdmin(getToken)
          .then((supabase) => supabase.removeChannel(subscription))
          .catch((error) => console.error('[MediaLibrary] Real-time cleanup failed:', error));
      }
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
    const normalizedTags = Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)));
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
    loading,
    createImageAsset,
    updateImageAsset,
    addTagsToImageAssets,
    deleteImageAsset,
    deleteImageAssets,
  };
}
