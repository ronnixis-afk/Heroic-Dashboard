/**
 * Regenerates src/constants/itemPortraitCatalog.ts from the RPG source of truth.
 *
 * Sources:
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/weaponLootTemplates.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/itemRegistry.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/itemArtFamilies.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/constants/materials.ts
 *
 * Weapons and Protection subtypes are genre-scoped and folded via ITEM_ART_FAMILIES_BY_GENRE.
 *
 * Override with HEROIC_RPG_ROOT if the repos are not siblings.
 *
 * Usage: npm run sync:item-catalog
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.resolve(__dirname, '..');

const defaultRpgRoot = path.resolve(dashboardRoot, '..', 'Heroic AI RPG', 'heroic-ai-rpg');
const rpgRoot = process.env.HEROIC_RPG_ROOT
  ? path.resolve(process.env.HEROIC_RPG_ROOT)
  : defaultRpgRoot;

const weaponsPath = path.join(rpgRoot, 'src', 'utils', 'item', 'weaponLootTemplates.ts');
const armorsPath = path.join(rpgRoot, 'src', 'utils', 'item', 'armorLootTemplates.ts');
const registryPath = path.join(rpgRoot, 'src', 'utils', 'item', 'itemRegistry.ts');
const familiesPath = path.join(rpgRoot, 'src', 'utils', 'item', 'itemArtFamilies.ts');
const materialsPath = path.join(rpgRoot, 'src', 'constants', 'materials.ts');
const outPath = path.join(dashboardRoot, 'src', 'constants', 'itemPortraitCatalog.ts');

const failSoft = process.argv.includes('--optional');
const GENRES = ['Fantasy', 'Modern', 'Sci-Fi'];

const missing = [weaponsPath, registryPath, materialsPath].filter((p) => !fs.existsSync(p));
if (missing.length > 0) {
  const message = `Item catalog source not found:\n  ${missing.join('\n  ')}\nSet HEROIC_RPG_ROOT or place the RPG repo as a sibling of Heroic-Dashboard.`;
  if (failSoft) {
    console.warn(`[sync:item-catalog] Skipped — ${message}`);
    process.exit(0);
  }
  console.error(`[sync:item-catalog] ${message}`);
  process.exit(1);
}

const uniqueSorted = (names) =>
  [...new Set(names.map((n) => n.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

const extractQuotedNames = (src, pattern) => {
  const names = [];
  let match;
  const re = new RegExp(pattern, 'g');
  while ((match = re.exec(src)) !== null) {
    names.push((match[1] || match[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  return names;
};

const extractTableNames = (registrySrc, tableKey) => {
  const keyRe = new RegExp(`${tableKey}\\s*:\\s*\\[`);
  const keyMatch = keyRe.exec(registrySrc);
  if (!keyMatch) return [];

  const start = keyMatch.index + keyMatch[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = start; i < registrySrc.length; i++) {
    if (registrySrc[i] === '[') depth++;
    else if (registrySrc[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return [];
  const body = registrySrc.slice(start, end + 1);
  return extractQuotedNames(body, /name:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/);
};

/**
 * Extract a single named const array of `w('Name', ...)` weapon templates
 * or `body('Name', ...)` / `shield('Name', ...)` armor templates.
 */
const extractNamedTemplateArray = (src, constName) => {
  const keyRe = new RegExp(
    `export\\s+const\\s+${constName}(?:\\s*:\\s*[^=]+)?\\s*=\\s*\\[`
  );
  const keyMatch = keyRe.exec(src);
  if (!keyMatch) return [];

  const start = keyMatch.index + keyMatch[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return [];
  const body = src.slice(start, end + 1);
  return extractQuotedNames(
    body,
    /(?:w|body|shield)\(\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/
  );
};

/**
 * Extract a single named const array of w('Name', ...) weapon templates.
 */
const extractNamedWeaponArray = (weaponsSrc, constName) =>
  extractNamedTemplateArray(weaponsSrc, constName);

/**
 * Parse ITEM_ART_FAMILIES_BY_GENRE into genre -> Map(member, family).
 * Falls back to flat ITEM_ART_FAMILIES as Fantasy-only when BY_GENRE is absent.
 */
const extractArtFamiliesByGenre = (familiesSrc) => {
  const result = {
    Fantasy: new Map(),
    Modern: new Map(),
    'Sci-Fi': new Map(),
  };
  if (!familiesSrc) return result;

  const byGenreRe = /ITEM_ART_FAMILIES_BY_GENRE(?:\s*:\s*[^=]+?)?\s*=\s*\{/;
  const byGenreMatch = byGenreRe.exec(familiesSrc);

  if (byGenreMatch) {
    const start = byGenreMatch.index + byGenreMatch[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let i = start; i < familiesSrc.length; i++) {
      if (familiesSrc[i] === '{') depth++;
      else if (familiesSrc[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end >= 0) {
      const body = familiesSrc.slice(start, end + 1).replace(/\/\/.*$/gm, '');
      // Genre key then nested object of member:family pairs
      const genreBlockRe =
        /(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|([A-Za-z_][\w-]*))\s*:\s*\{([^}]*)\}/g;
      let gMatch;
      while ((gMatch = genreBlockRe.exec(body)) !== null) {
        const genreKey = (gMatch[1] || gMatch[2] || gMatch[3] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
        if (!result[genreKey]) continue;
        const inner = gMatch[4] || '';
        const pairRe =
          /(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/g;
        let pMatch;
        while ((pMatch = pairRe.exec(inner)) !== null) {
          const member = (pMatch[1] || pMatch[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
          const family = (pMatch[3] || pMatch[4] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
          if (member && family) result[genreKey].set(member, family);
        }
      }
      return result;
    }
  }

  // Legacy flat ITEM_ART_FAMILIES → Fantasy only
  const flatRe = /ITEM_ART_FAMILIES(?:\s*:\s*Record<[^>]+>)?\s*=\s*\{/;
  const flatMatch = flatRe.exec(familiesSrc);
  if (flatMatch) {
    const start = flatMatch.index + flatMatch[0].length - 1;
    let depth = 0;
    let end = -1;
    for (let i = start; i < familiesSrc.length; i++) {
      if (familiesSrc[i] === '{') depth++;
      else if (familiesSrc[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end >= 0) {
      const body = familiesSrc.slice(start, end + 1).replace(/\/\/.*$/gm, '');
      const pairRe =
        /(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")\s*:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/g;
      let match;
      while ((match = pairRe.exec(body)) !== null) {
        const member = (match[1] || match[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
        const family = (match[3] || match[4] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
        if (member && family) result.Fantasy.set(member, family);
      }
    }
  }

  return result;
};

const foldThroughFamilies = (names, familyMap) => {
  if (!familyMap || familyMap.size === 0) return uniqueSorted(names);
  const normalize = (s) => s.trim().toLowerCase();
  const byNorm = new Map();
  for (const [member, family] of familyMap.entries()) {
    byNorm.set(normalize(member), family);
  }
  return uniqueSorted(names.map((name) => byNorm.get(normalize(name)) || name));
};

const weaponsSrc = fs.readFileSync(weaponsPath, 'utf8');
const armorsSrc = fs.existsSync(armorsPath) ? fs.readFileSync(armorsPath, 'utf8') : '';
const registrySrc = fs.readFileSync(registryPath, 'utf8');
const materialsSrc = fs.readFileSync(materialsPath, 'utf8');
const familiesSrc = fs.existsSync(familiesPath) ? fs.readFileSync(familiesPath, 'utf8') : '';
const artFamiliesByGenre = extractArtFamiliesByGenre(familiesSrc);

const weaponsByGenre = {
  Fantasy: extractNamedWeaponArray(weaponsSrc, 'FANTASY_WEAPON_LOOT_TEMPLATES'),
  Modern: extractNamedWeaponArray(weaponsSrc, 'MODERN_WEAPON_LOOT_TEMPLATES'),
  'Sci-Fi': extractNamedWeaponArray(weaponsSrc, 'SCIFI_WEAPON_LOOT_TEMPLATES'),
};

// Fallback: legacy single WEAPON_LOOT_TEMPLATES export
if (weaponsByGenre.Fantasy.length === 0) {
  weaponsByGenre.Fantasy = extractQuotedNames(
    weaponsSrc,
    /w\(\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/
  );
}

const armorsByGenre = {
  Fantasy: extractNamedTemplateArray(armorsSrc, 'FANTASY_ARMOR_LOOT_TEMPLATES'),
  Modern: extractNamedTemplateArray(armorsSrc, 'MODERN_ARMOR_LOOT_TEMPLATES'),
  'Sci-Fi': extractNamedTemplateArray(armorsSrc, 'SCIFI_ARMOR_LOOT_TEMPLATES'),
};

// Fallback: registry LOOT_TABLES.armors (Fantasy only, legacy)
if (armorsByGenre.Fantasy.length === 0) {
  armorsByGenre.Fantasy = extractTableNames(registrySrc, 'armors');
  armorsByGenre.Modern = armorsByGenre.Fantasy;
  armorsByGenre['Sci-Fi'] = armorsByGenre.Fantasy;
}

const accessories = uniqueSorted(extractTableNames(registrySrc, 'accessories'));
const wondrous = uniqueSorted(extractTableNames(registrySrc, 'wondrous'));
const utilities = uniqueSorted(extractTableNames(registrySrc, 'utilities'));
const throwables = uniqueSorted(extractTableNames(registrySrc, 'throwables'));
const consumables = uniqueSorted(extractTableNames(registrySrc, 'consumables'));
const quest = uniqueSorted(extractTableNames(registrySrc, 'quest'));
const materials = uniqueSorted(extractQuotedNames(materialsSrc, /typeTag:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/));

const sharedCategories = [
  { name: 'Accessories', subtypes: accessories },
  { name: 'Wondrous', subtypes: wondrous },
  { name: 'Utilities', subtypes: utilities },
  { name: 'Throwables', subtypes: throwables },
  { name: 'Consumables', subtypes: consumables },
  { name: 'Quest', subtypes: quest },
  { name: 'Material', subtypes: materials },
  { name: 'Currency', subtypes: ['Currency'] },
];

const catalogByGenre = {};
for (const genre of GENRES) {
  const weaponNames = weaponsByGenre[genre] || [];
  const weaponsFolded = foldThroughFamilies(weaponNames, artFamiliesByGenre[genre]);
  if (weaponsFolded.length < 10) {
    console.error(
      `[sync:item-catalog] Genre "${genre}" has too few Weapons subtypes (${weaponsFolded.length}). Aborting.`
    );
    process.exit(1);
  }

  const armorNames = armorsByGenre[genre] || [];
  const armorsFolded = foldThroughFamilies(armorNames, artFamiliesByGenre[genre]);
  if (armorsFolded.length < 4) {
    console.error(
      `[sync:item-catalog] Genre "${genre}" has too few Protection subtypes (${armorsFolded.length}). Aborting.`
    );
    process.exit(1);
  }

  catalogByGenre[genre] = [
    { name: 'Weapons', subtypes: weaponsFolded },
    { name: 'Protection', subtypes: armorsFolded },
    ...sharedCategories,
  ];
}

const totalSubtypes = GENRES.reduce(
  (sum, g) => sum + catalogByGenre[g].reduce((s, e) => s + e.subtypes.length, 0),
  0
);
if (totalSubtypes < 40) {
  console.error(`[sync:item-catalog] Parsed too few subtypes (${totalSubtypes}). Aborting.`);
  process.exit(1);
}

const serializeList = (list) =>
  list.length === 0
    ? '[]'
    : `[\n${list.map((n) => `    '${n.replace(/'/g, "\\'")}',`).join('\n')}\n  ]`;

const serializeArtFamilies = (map) => {
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return '{\n}';
  return `{\n${entries
    .map(
      ([member, family]) =>
        `  '${member.replace(/'/g, "\\'")}': '${family.replace(/'/g, "\\'")}',`
    )
    .join('\n')}\n}`;
};

const serializeCatalog = (catalog) =>
  catalog
    .map(
      (entry) => `  {
    name: '${entry.name}',
    subtypes: ${serializeList(entry.subtypes)},
  }`
    )
    .join(',\n');

const serializeCatalogByGenre = () =>
  GENRES.map(
    (genre) =>
      `  '${genre}': [\n${serializeCatalog(catalogByGenre[genre]).replace(/^/gm, '  ')}\n  ]`
  ).join(',\n');

const serializeArtFamiliesByGenre = () =>
  GENRES.map(
    (genre) => `  '${genre}': ${serializeArtFamilies(artFamiliesByGenre[genre]).replace(/\n/g, '\n  ')}`
  ).join(',\n');

const today = new Date().toISOString().slice(0, 10);
const fantasyMapEntries = artFamiliesByGenre.Fantasy.size;

const file = `/**
 * AUTO-GENERATED by scripts/extract-item-catalog.mjs — do not edit by hand.
 * Source: heroic-ai-rpg item blueprints (weaponLootTemplates, armorLootTemplates, itemRegistry, itemArtFamilies, materials).
 * Weapons/Protection subtypes are genre-scoped; fold via ITEM_ART_FAMILIES_BY_GENRE.
 * Sync: npm run sync:item-catalog
 *
 * Last synced: ${today}
 */

export type ItemPortraitGenre = 'Fantasy' | 'Modern' | 'Sci-Fi';

export type ItemPortraitCategory =
  | 'Weapons'
  | 'Protection'
  | 'Accessories'
  | 'Wondrous'
  | 'Utilities'
  | 'Throwables'
  | 'Consumables'
  | 'Quest'
  | 'Material'
  | 'Currency';

export interface ItemPortraitCategoryEntry {
  readonly name: ItemPortraitCategory;
  readonly subtypes: readonly string[];
}

export const ITEM_PORTRAIT_CATALOG_BY_GENRE: Record<
  ItemPortraitGenre,
  readonly ItemPortraitCategoryEntry[]
> = {
${serializeCatalogByGenre()},
};

/** Fantasy catalog — backward-compatible flat export. */
export const ITEM_PORTRAIT_CATALOG: readonly ItemPortraitCategoryEntry[] =
  ITEM_PORTRAIT_CATALOG_BY_GENRE.Fantasy;

/** Member chassis → shared art family, per genre. */
export const ITEM_ART_FAMILIES_BY_GENRE: Readonly<
  Record<ItemPortraitGenre, Readonly<Record<string, string>>>
> = {
${serializeArtFamiliesByGenre()},
};

/** Fantasy art families — backward-compatible flat export. */
export const ITEM_ART_FAMILIES: Readonly<Record<string, string>> =
  ITEM_ART_FAMILIES_BY_GENRE.Fantasy;

const normalizeArtFamilyKey = (value: string | null | undefined): string =>
  (value || '').trim().toLowerCase();

export function resolveItemPortraitGenre(
  genre: string | null | undefined
): ItemPortraitGenre {
  const key = (genre || 'Fantasy').toString().toLowerCase();
  if (key.includes('sci')) return 'Sci-Fi';
  if (key.includes('modern')) return 'Modern';
  return 'Fantasy';
}

/** Fold a chassis or family name to the upload / match art-family key. */
export function resolveItemArtFamily(
  name: string,
  genre: string | null | undefined = 'Fantasy'
): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return trimmed;
  const map = ITEM_ART_FAMILIES_BY_GENRE[resolveItemPortraitGenre(genre)];
  const target = normalizeArtFamilyKey(trimmed);
  for (const [member, family] of Object.entries(map)) {
    if (normalizeArtFamilyKey(member) === target) return family;
  }
  return trimmed;
}

/** Family representative plus every chassis that shares its image bucket. */
export function getItemArtFamilyMembers(
  familyOrMember: string,
  genre: string | null | undefined = 'Fantasy'
): string[] {
  const resolvedGenre = resolveItemPortraitGenre(genre);
  const family = resolveItemArtFamily(familyOrMember, resolvedGenre);
  if (!family) return [];
  const map = ITEM_ART_FAMILIES_BY_GENRE[resolvedGenre];
  const familyKey = normalizeArtFamilyKey(family);
  const members = new Set<string>([family]);
  for (const [member, mapped] of Object.entries(map)) {
    if (normalizeArtFamilyKey(mapped) === familyKey) {
      members.add(member);
      members.add(mapped);
    }
  }
  return [...members];
}

export const getItemPortraitCategoryNames = (
  genre: string | null | undefined = 'Fantasy'
): readonly ItemPortraitCategory[] =>
  ITEM_PORTRAIT_CATALOG_BY_GENRE[resolveItemPortraitGenre(genre)].map((entry) => entry.name);

/** Art-family names for Weapons/Protection; exact template names for other categories. */
export const getItemPortraitSubtypes = (
  category: string,
  genre: string | null | undefined = 'Fantasy'
): readonly string[] => {
  const resolvedGenre = resolveItemPortraitGenre(genre);
  const normalized = category.trim().toLowerCase();
  const entry = ITEM_PORTRAIT_CATALOG_BY_GENRE[resolvedGenre].find(
    (row) => row.name.toLowerCase() === normalized
  );
  return entry?.subtypes ?? [];
};
`;

fs.writeFileSync(outPath, file);
const weaponCounts = GENRES.map((g) => {
  const w = catalogByGenre[g].find((e) => e.name === 'Weapons');
  return `${g}=${w?.subtypes.length ?? 0}`;
}).join(', ');
const armorCounts = GENRES.map((g) => {
  const a = catalogByGenre[g].find((e) => e.name === 'Protection');
  return `${g}=${a?.subtypes.length ?? 0}`;
}).join(', ');
console.log(
  `[sync:item-catalog] Wrote 3 genres / ${totalSubtypes} total subtypes ` +
    `(Weapons: ${weaponCounts}; Protection: ${armorCounts}; ${fantasyMapEntries} Fantasy art-family mappings) to ${path.relative(dashboardRoot, outPath)}`
);
