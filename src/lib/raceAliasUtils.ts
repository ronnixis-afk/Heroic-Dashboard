/**
 * Race alias and normalization utilities for Heroic Dashboard.
 * Keeps Media Library and upload forms aligned with the RPG's race catalog and asset storage.
 */

/** Irregular plural stems to collapse to singular canonical keys */
const IRREGULAR_RACE_STEMS: Array<{ pattern: RegExp; singular: string }> = [
  { pattern: /(elves|elven|elf)$/i, singular: 'elf' },
  { pattern: /(dwarves|dwarven|dwarf)$/i, singular: 'dwarf' },
  { pattern: /(werewolves|werewolf)$/i, singular: 'werewolf' },
  { pattern: /(homunculi|homunculus)$/i, singular: 'homunculus' },
  { pattern: /(djinn|djinni|djinns)$/i, singular: 'djinn' },
  { pattern: /(nephilim)$/i, singular: 'nephilim' },
];

/** Normalize race string to a comparable canonical lowercase key */
export function normalizeRaceKey(race: string | undefined | null): string {
  let normalized = (race || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return '';

  for (const entry of IRREGULAR_RACE_STEMS) {
    if (entry.pattern.test(normalized)) {
      return normalized.replace(entry.pattern, entry.singular);
    }
  }

  if (normalized.endsWith('ies') && normalized.length > 4) {
    return `${normalized.slice(0, -3)}y`;
  }
  if (normalized.endsWith('ses') && normalized.length > 4) {
    return normalized.slice(0, -2);
  }
  if (normalized.endsWith('s') && !normalized.endsWith('ss') && normalized.length > 3) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

/**
 * Get equivalent race alias keys for image matching.
 * E.g., 'werewolf' -> ['lycanthrope'], 'dark-elf' -> ['dark elf', 'drow'],
 * 'halfling' -> ['halfling/gnome'], 'high elf' -> ['elf'].
 */
export function getRaceAliases(race: string | undefined | null): string[] {
  const raw = (race || '').trim().toLowerCase();
  if (!raw) return [];

  const normalized = normalizeRaceKey(raw);
  const aliases = new Set<string>();

  // Hyphen vs space equivalence (e.g. 'dark-elf' <-> 'dark elf', 'half-elf' <-> 'half elf')
  if (normalized.includes('-')) {
    aliases.add(normalized.replace(/-/g, ' '));
  } else if (normalized.includes(' ')) {
    aliases.add(normalized.replace(/\s+/g, '-'));
  }

  // Werewolf <-> Lycanthrope
  if (normalized === 'werewolf') {
    aliases.add('lycanthrope');
    aliases.add('lycanthropes');
  } else if (normalized === 'lycanthrope') {
    aliases.add('werewolf');
    aliases.add('werewolves');
  }

  // Drow <-> Dark-Elf
  if (normalized === 'drow') {
    aliases.add('dark-elf');
    aliases.add('dark elf');
  } else if (normalized === 'dark-elf' || normalized === 'dark elf') {
    aliases.add('drow');
  }

  // Halfling / Gnome composite matches
  if (
    normalized === 'halfling' ||
    normalized === 'gnome' ||
    normalized === 'forest gnome' ||
    normalized === 'deep gnome'
  ) {
    aliases.add('halfling/gnome');
    aliases.add('halfling / gnome');
  }

  // Subrace fallback to parent stem (e.g. 'high elf' -> 'elf', 'mountain dwarf' -> 'dwarf')
  if (!normalized.startsWith('half-') && !normalized.startsWith('half ')) {
    const tokens = normalized.split(/[\s/_-]+/).filter(Boolean);
    if (tokens.length > 1) {
      const parentTail = normalizeRaceKey(tokens[tokens.length - 1]);
      if (parentTail && parentTail !== normalized) {
        aliases.add(parentTail);
      }
    }
  }

  return Array.from(aliases);
}

/**
 * Resolves the portrait count for a race option from the facet counts map.
 * Supports:
 * 1. Exact string match
 * 2. Case-insensitive match (e.g. 'Dark-Elf' matching DB row 'Dark-elf')
 * 3. Hyphen/space variations (e.g. 'Half-Elf' matching 'Half elf')
 * 4. Equivalent race aliases (e.g. 'Werewolf' matching 'Lycanthrope', 'High Elf' matching 'Elf')
 */
export function getRacePortraitCount(
  counts: Record<string, number>,
  race: string | undefined | null
): number {
  if (!race || !counts) return 0;
  const trimmed = race.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'any race') return 0;

  const raceLower = trimmed.toLowerCase();
  const raceNormalized = normalizeRaceKey(trimmed);
  const raceClean = raceLower.replace(/[\s-_]+/g, ' ');

  // 1. Direct case-insensitive, normalized, and clean hyphen/space match
  let directSum = 0;
  let hasDirectMatch = false;

  for (const [key, count] of Object.entries(counts)) {
    const keyTrimmed = key.trim();
    const keyLower = keyTrimmed.toLowerCase();
    const keyNormalized = normalizeRaceKey(keyTrimmed);
    const keyClean = keyLower.replace(/[\s-_]+/g, ' ');

    if (
      keyTrimmed === trimmed ||
      keyLower === raceLower ||
      keyNormalized === raceNormalized ||
      keyClean === raceClean
    ) {
      directSum += count;
      hasDirectMatch = true;
    }
  }

  if (hasDirectMatch && directSum > 0) {
    return directSum;
  }

  // 2. Alias / Parent race matching
  const aliases = getRaceAliases(trimmed);
  for (const alias of aliases) {
    const aliasLower = alias.trim().toLowerCase();
    const aliasNormalized = normalizeRaceKey(alias);
    const aliasClean = aliasLower.replace(/[\s-_]+/g, ' ');

    let aliasSum = 0;
    for (const [key, count] of Object.entries(counts)) {
      const keyTrimmed = key.trim();
      const keyLower = keyTrimmed.toLowerCase();
      const keyNormalized = normalizeRaceKey(keyTrimmed);
      const keyClean = keyLower.replace(/[\s-_]+/g, ' ');

      if (
        keyLower === aliasLower ||
        keyNormalized === aliasNormalized ||
        keyClean === aliasClean
      ) {
        aliasSum += count;
      }
    }

    if (aliasSum > 0) {
      return aliasSum;
    }
  }

  return 0;
}

/** Genre assumed for catalog Race rows with an empty `genres` list (same default as Media create). */
export const DEFAULT_RACE_GENRE = 'Fantasy';

/** Minimal shape of a DB catalog race needed for genre-scoped dropdown filtering. */
export interface RaceGenreFilterInput {
  name: string;
  genres?: readonly string[] | null;
}

/** Genres a catalog race should be listed under; empty rows fall back to Fantasy (never every genre). */
export function getRaceGenresForFilter(race: Pick<RaceGenreFilterInput, 'genres'>): string[] {
  return race.genres && race.genres.length > 0 ? [...race.genres] : [DEFAULT_RACE_GENRE];
}

/**
 * DB catalog race names for a portrait upload genre.
 * - `Any Genre` (or empty) → the full catalog union.
 * - Fantasy / Modern / Sci-Fi → only races whose `genres` include that genre
 *   (multi-genre races appear under each of their genres).
 */
export function getDbRaceNamesForGenre(
  races: readonly RaceGenreFilterInput[],
  genre: string | undefined | null
): string[] {
  const scopedGenre = (genre || '').trim();
  if (!scopedGenre || scopedGenre === 'Any Genre') {
    return races.map((race) => race.name);
  }
  return races
    .filter((race) => getRaceGenresForFilter(race).includes(scopedGenre))
    .map((race) => race.name);
}
