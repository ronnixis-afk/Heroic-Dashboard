/**
 * Return raw Supabase storage object URL unchanged.
 * Supabase storage image transformations (/storage/v1/render/image/...) are intentionally
 * disabled to preserve transform quota when browsing Admin Media. CSS handles thumbnail sizing.
 */
export function getOptimizedThumbnailUrl(
  url: string | null | undefined,
  _options: { width?: number; height?: number; quality?: number } = {}
): string {
  if (!url || typeof url !== 'string') return '';
  return url.trim();
}
