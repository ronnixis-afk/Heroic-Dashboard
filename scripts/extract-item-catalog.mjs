/**
 * Regenerates src/constants/itemPortraitCatalog.ts from the RPG source of truth.
 *
 * Sources:
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/weaponLootTemplates.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/armorLootTemplates.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/consumableLootTemplates.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/throwableLootTemplates.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/itemRegistry.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/utils/item/itemArtFamilies.ts
 *   - ../Heroic AI RPG/heroic-ai-rpg/src/constants/materials.ts
 *
 * Weapons, Protection, Consumables, and Throwables are genre-scoped and folded via ITEM_ART_FAMILIES_BY_GENRE.
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
const consumablesPath = path.join(rpgRoot, 'src', 'utils', 'item', 'consumableLootTemplates.ts');
const throwablesPath = path.join(rpgRoot, 'src', 'utils', 'item', 'throwableLootTemplates.ts');
const utilitiesPath = path.join(rpgRoot, 'src', 'utils', 'item', 'utilityLootTemplates.ts');
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

/** Slice the `[...]` body of `export const Name = [...]`. */
const extractConstArrayBody = (src, constName) => {
  const keyRe = new RegExp(
    `export\\s+const\\s+${constName}(?:\\s*:\\s*[^=]+)?\\s*=\\s*\\[`
  );
  const keyMatch = keyRe.exec(src);
  if (!keyMatch) return '';

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
  if (end < 0) return '';
  return src.slice(start, end + 1);
};

/**
 * Extract a single named const array of helper chassis templates:
 * w/body/shield/heal/buff/dmg/status('Name', ...)
 * also falls back to name: '...' properties inside the array body.
 */
const extractNamedTemplateArray = (src, constName) => {
  const body = extractConstArrayBody(src, constName);
  if (!body) return [];
  const helperNames = extractQuotedNames(
    body,
    /(?:w|body|shield|heal|buff|dmg|status|util)\(\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/
  );
  if (helperNames.length > 0) return helperNames;
  return extractQuotedNames(body, /name:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/);
};

/**
 * Extract chassis display names from Record maps:
 * - flat: Fire: 'Resistance Potion'
 * - nested: Fire: { name: 'Damage Vial', role: 'fire_single' }  (name only)
 */
const extractNameMapValues = (src, constName) => {
  const re = new RegExp(
    `(?:export\\s+)?const\\s+${constName}\\s*(?::[^=]+)?=\\s*\\{`,
    'm'
  );
  const match = re.exec(src);
  if (!match) return [];
  const start = match.index + match[0].length - 1;
  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return [];
  const body = src.slice(start, end + 1);
  // Nested { name: 'Damage Vial', role: '...' } — only the name field
  const nestedNames = extractQuotedNames(
    body,
    /name:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^'])*)")/
  );
  if (nestedNames.length > 0) return nestedNames;
  // Flat string maps: Fire: 'Resistance Potion' (skip role-like tokens)
  const stringValues = extractQuotedNames(
    body,
    /:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^'])*)")\s*[,}]/
  ).filter((name) => !/_(?:single|aoe|spread)$/i.test(name) && !/^[a-z]+(?:_[a-z]+)+$/.test(name));
  return uniqueSorted(stringValues);
};

/** Merge array helper names with companion name-map consts used via spreads. */
const extractConsumableChassisNames = (src, arrayConstName, mapPrefix = '') =>
  uniqueSorted([
    ...extractNamedTemplateArray(src, arrayConstName),
    ...extractNameMapValues(src, `${mapPrefix}RESIST_NAMES`),
    ...extractNameMapValues(src, `${mapPrefix}IMMUNE_NAMES`),
    ...extractNameMapValues(src, `${mapPrefix}WARD_NAMES`),
  ]);

const extractThrowableChassisNames = (src, arrayConstName, mapPrefix = '') =>
  uniqueSorted([
    ...extractNamedTemplateArray(src, arrayConstName),
    ...extractNameMapValues(src, `${mapPrefix}DAMAGE_VIAL_NAMES`),
    ...extractNameMapValues(src, `${mapPrefix}BOMB_NAMES`),
  ]);

/**
 * Extract a single named const array of w('Name', ...) weapon templates.
 */
const extractNamedWeaponArray = (weaponsSrc, constName) =>
  extractNamedTemplateArray(weaponsSrc, constName);

/** Chassis name → Light | Medium | Heavy from w('Name', 'Light Weapon', ...). */
const extractWeaponWeightMap = (src, constName) => {
  const body = extractConstArrayBody(src, constName);
  const map = new Map();
  if (!body) return map;
  const re =
    /w\(\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")\s*,\s*(?:'(Light|Medium|Heavy) Weapon'|"(Light|Medium|Heavy) Weapon")/g;
  let match;
  while ((match = re.exec(body)) !== null) {
    const name = (match[1] || match[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
    const weight = match[3] || match[4];
    if (name && weight) map.set(name, weight);
  }
  return map;
};

/** Chassis name → Light | Medium | Heavy | Shield from body(...)/shield(...). */
const extractArmorWeightMap = (src, constName) => {
  const body = extractConstArrayBody(src, constName);
  const map = new Map();
  if (!body) return map;
  const bodyRe =
    /body\(\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")\s*,\s*(?:'(light|medium|heavy)'|"(light|medium|heavy)")/gi;
  let match;
  while ((match = bodyRe.exec(body)) !== null) {
    const name = (match[1] || match[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
    const raw = (match[3] || match[4] || '').toLowerCase();
    if (!name || !raw) continue;
    map.set(name, raw.charAt(0).toUpperCase() + raw.slice(1));
  }
  const shieldRe = /shield\(\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/g;
  while ((match = shieldRe.exec(body)) !== null) {
    const name = (match[1] || match[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
    if (name) map.set(name, 'Shield');
  }
  return map;
};

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
const consumablesSrc = fs.existsSync(consumablesPath) ? fs.readFileSync(consumablesPath, 'utf8') : '';
const throwablesSrc = fs.existsSync(throwablesPath) ? fs.readFileSync(throwablesPath, 'utf8') : '';
const utilitiesSrc = fs.existsSync(utilitiesPath) ? fs.readFileSync(utilitiesPath, 'utf8') : '';
const registrySrc = fs.readFileSync(registryPath, 'utf8');
const materialsSrc = fs.readFileSync(materialsPath, 'utf8');
const familiesSrc = fs.existsSync(familiesPath) ? fs.readFileSync(familiesPath, 'utf8') : '';
const artFamiliesByGenre = extractArtFamiliesByGenre(familiesSrc);

const weaponsByGenre = {
  Fantasy: extractNamedWeaponArray(weaponsSrc, 'FANTASY_WEAPON_LOOT_TEMPLATES'),
  Modern: extractNamedWeaponArray(weaponsSrc, 'MODERN_WEAPON_LOOT_TEMPLATES'),
  'Sci-Fi': extractNamedWeaponArray(weaponsSrc, 'SCIFI_WEAPON_LOOT_TEMPLATES'),
};

const weaponWeightByGenre = {
  Fantasy: extractWeaponWeightMap(weaponsSrc, 'FANTASY_WEAPON_LOOT_TEMPLATES'),
  Modern: extractWeaponWeightMap(weaponsSrc, 'MODERN_WEAPON_LOOT_TEMPLATES'),
  'Sci-Fi': extractWeaponWeightMap(weaponsSrc, 'SCIFI_WEAPON_LOOT_TEMPLATES'),
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

const armorWeightByGenre = {
  Fantasy: extractArmorWeightMap(armorsSrc, 'FANTASY_ARMOR_LOOT_TEMPLATES'),
  Modern: extractArmorWeightMap(armorsSrc, 'MODERN_ARMOR_LOOT_TEMPLATES'),
  'Sci-Fi': extractArmorWeightMap(armorsSrc, 'SCIFI_ARMOR_LOOT_TEMPLATES'),
};

// Fallback: registry LOOT_TABLES.armors (Fantasy only, legacy)
if (armorsByGenre.Fantasy.length === 0) {
  armorsByGenre.Fantasy = extractTableNames(registrySrc, 'armors');
  armorsByGenre.Modern = armorsByGenre.Fantasy;
  armorsByGenre['Sci-Fi'] = armorsByGenre.Fantasy;
}

const consumablesByGenre = {
  Fantasy: extractConsumableChassisNames(consumablesSrc, 'FANTASY_CONSUMABLE_LOOT_TEMPLATES'),
  Modern: extractConsumableChassisNames(consumablesSrc, 'MODERN_CONSUMABLE_LOOT_TEMPLATES', 'MODERN_'),
  'Sci-Fi': extractConsumableChassisNames(consumablesSrc, 'SCIFI_CONSUMABLE_LOOT_TEMPLATES', 'SCIFI_'),
};
if (consumablesByGenre.Fantasy.length === 0) {
  const legacy = extractTableNames(registrySrc, 'consumables');
  consumablesByGenre.Fantasy = legacy;
  consumablesByGenre.Modern = legacy;
  consumablesByGenre['Sci-Fi'] = legacy;
}

const throwablesByGenre = {
  Fantasy: extractThrowableChassisNames(throwablesSrc, 'FANTASY_THROWABLE_LOOT_TEMPLATES'),
  Modern: extractThrowableChassisNames(throwablesSrc, 'MODERN_THROWABLE_LOOT_TEMPLATES', 'MODERN_'),
  'Sci-Fi': extractThrowableChassisNames(throwablesSrc, 'SCIFI_THROWABLE_LOOT_TEMPLATES', 'SCIFI_'),
};
if (throwablesByGenre.Fantasy.length === 0) {
  const legacy = extractTableNames(registrySrc, 'throwables');
  throwablesByGenre.Fantasy = legacy;
  throwablesByGenre.Modern = legacy;
  throwablesByGenre['Sci-Fi'] = legacy;
}

const utilitiesByGenre = {
  Fantasy: extractNamedTemplateArray(utilitiesSrc, 'FANTASY_UTILITY_LOOT_TEMPLATES'),
  Modern: extractNamedTemplateArray(utilitiesSrc, 'MODERN_UTILITY_LOOT_TEMPLATES'),
  'Sci-Fi': extractNamedTemplateArray(utilitiesSrc, 'SCIFI_UTILITY_LOOT_TEMPLATES'),
};
if (utilitiesByGenre.Fantasy.length === 0) {
  const legacy = extractTableNames(registrySrc, 'utilities');
  utilitiesByGenre.Fantasy = legacy;
  utilitiesByGenre.Modern = legacy;
  utilitiesByGenre['Sci-Fi'] = legacy;
}

const accessories = uniqueSorted(extractTableNames(registrySrc, 'accessories'));
const wondrous = uniqueSorted(extractTableNames(registrySrc, 'wondrous'));
const quest = uniqueSorted(extractTableNames(registrySrc, 'quest'));
const materials = uniqueSorted(extractQuotedNames(materialsSrc, /typeTag:\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)")/));

const catalogByGenre = {};
/** Chassis / art-family name → Light | Medium | Heavy | Shield (Weapons + Protection only). */
const weightCategoryByGenre = {
  Fantasy: new Map(),
  Modern: new Map(),
  'Sci-Fi': new Map(),
};
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

  const consumableNames = consumablesByGenre[genre] || [];
  const consumablesFolded = foldThroughFamilies(consumableNames, artFamiliesByGenre[genre]);
  const throwableNames = foldThroughFamilies(throwablesByGenre[genre] || [], artFamiliesByGenre[genre]);
  const utilityNames = foldThroughFamilies(utilitiesByGenre[genre] || [], artFamiliesByGenre[genre]);

  const weightMap = weightCategoryByGenre[genre];
  for (const [name, weight] of weaponWeightByGenre[genre].entries()) {
    weightMap.set(name, weight);
  }
  for (const [name, weight] of armorWeightByGenre[genre].entries()) {
    weightMap.set(name, weight);
  }

  catalogByGenre[genre] = [
    { name: 'Weapons', subtypes: weaponsFolded },
    { name: 'Protection', subtypes: armorsFolded },
    { name: 'Accessories', subtypes: accessories },
    { name: 'Wondrous', subtypes: wondrous },
    { name: 'Utilities', subtypes: utilityNames },
    { name: 'Throwables', subtypes: throwableNames },
    { name: 'Consumables', subtypes: consumablesFolded },
    { name: 'Quest', subtypes: quest },
    { name: 'Material', subtypes: materials },
    { name: 'Currency', subtypes: ['Currency'] },
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

const serializeWeightCategories = (map) => {
  const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) return '{\n}';
  return `{\n${entries
    .map(
      ([name, weight]) =>
        `  '${name.replace(/'/g, "\\'")}': '${weight.replace(/'/g, "\\'")}',`
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

const serializeWeightCategoriesByGenre = () =>
  GENRES.map(
    (genre) =>
      `  '${genre}': ${serializeWeightCategories(weightCategoryByGenre[genre]).replace(/\n/g, '\n  ')}`
  ).join(',\n');

const today = new Date().toISOString().slice(0, 10);
const fantasyMapEntries = artFamiliesByGenre.Fantasy.size;

const file = `/**
 * AUTO-GENERATED by scripts/extract-item-catalog.mjs — do not edit by hand.
 * Source: heroic-ai-rpg item blueprints (weaponLootTemplates, armorLootTemplates, itemRegistry, itemArtFamilies, materials).
 * Weapons/Protection subtypes are genre-scoped; fold via ITEM_ART_FAMILIES_BY_GENRE.
 * Weight categories (Light / Medium / Heavy / Shield) come from weapon tags and armorStats.armorType.
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

export type ItemWeightCategory = 'Light' | 'Medium' | 'Heavy' | 'Shield';

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

/** Chassis / art-family name → weight category for Weapons and Protection, per genre. */
export const ITEM_WEIGHT_CATEGORY_BY_GENRE: Readonly<
  Record<ItemPortraitGenre, Readonly<Record<string, ItemWeightCategory>>>
> = {
${serializeWeightCategoriesByGenre()},
};

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

/** Light / Medium / Heavy / Shield for a weapon or protection chassis (or art family). */
export function getItemWeightCategory(
  name: string,
  genre: string | null | undefined = 'Fantasy'
): ItemWeightCategory | undefined {
  const trimmed = (name || '').trim();
  if (!trimmed) return undefined;
  const resolvedGenre = resolveItemPortraitGenre(genre);
  const map = ITEM_WEIGHT_CATEGORY_BY_GENRE[resolvedGenre];
  const direct = map[trimmed];
  if (direct) return direct;
  const family = resolveItemArtFamily(trimmed, resolvedGenre);
  if (family !== trimmed && map[family]) return map[family];
  const target = normalizeArtFamilyKey(trimmed);
  for (const [key, weight] of Object.entries(map)) {
    if (normalizeArtFamilyKey(key) === target) return weight;
  }
  return undefined;
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
