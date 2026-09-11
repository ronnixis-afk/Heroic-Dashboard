import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getOptimizedThumbnailUrl } from '../src/lib/thumbnailUtils';

describe('Admin Media Thumbnail URL Generation', () => {
  it('returns raw Supabase storage public URL unchanged without render/image transform', () => {
    const rawPublicUrl =
      'https://xyzcompany.supabase.co/storage/v1/object/public/game-assets/portraits/hero123.webp';

    const result = getOptimizedThumbnailUrl(rawPublicUrl, {
      width: 240,
      height: 240,
      quality: 80,
    });

    assert.equal(result, rawPublicUrl);
    assert.ok(!result.includes('/storage/v1/render/image/'));
    assert.ok(!result.includes('resize=cover'));
    assert.ok(!result.includes('width='));
    assert.ok(!result.includes('quality='));
  });

  it('handles empty or missing URLs gracefully', () => {
    assert.equal(getOptimizedThumbnailUrl(''), '');
    assert.equal(getOptimizedThumbnailUrl(null as unknown as string), '');
    assert.equal(getOptimizedThumbnailUrl(undefined as unknown as string), '');
  });

  it('leaves non-storage URLs untouched', () => {
    const genericUrl = 'https://example.com/images/avatar.png';
    assert.equal(getOptimizedThumbnailUrl(genericUrl), genericUrl);
  });
});
