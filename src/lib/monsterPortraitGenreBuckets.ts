/**
 * Which Media Library genre owns a monster subtype's portraits.
 *
 * Humanoids keep one library per spawn genre. Every other subtype that spawns in
 * more than one genre (or in all of them, via an empty list) shares the `Mixed`
 * library. Mirrors the RPG match route's Mixed rule.
 */
export const MIXED_IMAGE_GENRE = 'Mixed';

const PER_GENRE_MONSTER_TYPES = new Set(['humanoid']);

const normalizeGenres = (genres: readonly string[] | null | undefined): string[] => {
  if (!Array.isArray(genres)) return [];
  const out: string[] = [];
  for (const raw of genres) {
    if (typeof raw !== 'string') continue;
    const genre = raw.trim();
    if (genre && !out.includes(genre)) out.push(genre);
  }
  return out;
};

/** The subtype's own genres when set, otherwise the type's genres. */
export const getEffectiveSubtypeGenres = (
  subtypeGenres: readonly string[] | null | undefined,
  typeGenres: readonly string[] | null | undefined
): string[] => {
  const own = normalizeGenres(subtypeGenres);
  return own.length > 0 ? own : normalizeGenres(typeGenres);
};

export const isSharedMonsterSubtype = (
  typeName: string,
  subtypeGenres: readonly string[] | null | undefined,
  typeGenres: readonly string[] | null | undefined
): boolean => {
  if (PER_GENRE_MONSTER_TYPES.has(typeName.trim().toLowerCase())) return false;
  return getEffectiveSubtypeGenres(subtypeGenres, typeGenres).length !== 1;
};

/** True when uploads for this subtype belong under the selected Media Library genre. */
export const isMonsterSubtypeInImageGenre = (
  typeName: string,
  subtypeGenres: readonly string[] | null | undefined,
  typeGenres: readonly string[] | null | undefined,
  imageGenre: string
): boolean => {
  if (imageGenre === 'Any Genre') return true;
  const shared = isSharedMonsterSubtype(typeName, subtypeGenres, typeGenres);
  if (imageGenre === MIXED_IMAGE_GENRE) return shared;
  if (shared) return false;
  const effective = getEffectiveSubtypeGenres(subtypeGenres, typeGenres);
  if (effective.length === 0) return true;
  const target = imageGenre.toLowerCase();
  return effective.some((genre) => genre.toLowerCase() === target);
};
