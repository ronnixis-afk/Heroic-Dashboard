/**
 * Origin Item catalog for Media Library uploads.
 *
 * One picture per origin. The live game looks up keepsake art with:
 *   GET /api/image-assets/origin-item-defaults?startingStoryId=<id>
 * expecting assetType "Origin Item", genre "Any Genre", and
 * metadata.startingStoryId equal to one of these ids.
 */

export const ORIGIN_ITEM_OPTIONS = [
  { id: 'humble_beginnings', name: 'Humble Beginnings' },
  { id: 'the_drifter', name: 'The Drifter' },
  { id: 'the_blank_slate', name: 'The Blank Slate' },
  { id: 'the_pariah', name: 'The Pariah' },
  { id: 'the_fallen_house', name: 'The Fallen House' },
] as const;

export type OriginItemStartingStoryId = (typeof ORIGIN_ITEM_OPTIONS)[number]['id'];

const ORIGIN_ITEM_IDS = new Set<string>(ORIGIN_ITEM_OPTIONS.map((option) => option.id));

export const isOriginItemStartingStoryId = (value: string): value is OriginItemStartingStoryId =>
  ORIGIN_ITEM_IDS.has(value);

export const getOriginItemDisplayName = (startingStoryId: string): string =>
  ORIGIN_ITEM_OPTIONS.find((option) => option.id === startingStoryId)?.name || startingStoryId;
