import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export const IMAGE_ASSET_BUCKET = 'dashboard-image-assets';

export const IMAGE_GENRES = ['Fantasy', 'Sci-Fi', 'Magitech', 'Modern'] as const;
export const IMAGE_ASSET_TYPES = ['Character Portrait', 'Point Of Interest Image', 'Zone Image', 'Item Image'] as const;

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
}

export type UpdateImageAssetInput = ImageAssetInput;

const normalizeFolderName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

async function fetchImageAssets(getToken: (options?: any) => Promise<string | null>): Promise<ImageAsset[]> {
  const supabase = await getSupabaseForAdmin(getToken);
  const { data, error } = await supabase
    .from('ImageAsset')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('[MediaLibrary] Fetch image assets failed:', error);
    throw error;
  }

  return (data || []) as ImageAsset[];
}

export function useImageAssets() {
  const queryClient = useQueryClient();
  const { getToken, user } = useAuth();

  const { data: assets = [], isLoading: loading } = useQuery({
    queryKey: ['image-assets'],
    queryFn: () => fetchImageAssets(getToken),
  });

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
    const objectPath = [
      normalizeFolderName(input.assetType),
      normalizeFolderName(input.genre),
      `${id}.webp`,
    ].join('/');

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
      width: 500,
      height: 500,
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

  return {
    assets,
    loading,
    createImageAsset,
    updateImageAsset,
    deleteImageAsset,
  };
}
