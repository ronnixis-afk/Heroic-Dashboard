/**
 * Regenerates src/constants/powerImageCatalog.ts from the RPG source of truth.
 *
 * Sources:
 *   - heroic-ai-rpg/src/types/Core.ts (DAMAGE_TYPES, DEBUFF_STATUS_EFFECTS)
 *   - heroic-ai-rpg/src/constants/powerImageCatalog.ts (POWER_IMAGE_CATEGORIES)
 *
 * Override with HEROIC_RPG_ROOT if the repos are not siblings.
 *
 * Usage: npm run sync:power-catalog
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

const corePath = path.join(rpgRoot, 'src', 'types', 'Core.ts');
const catalogPath = path.join(rpgRoot, 'src', 'constants', 'powerImageCatalog.ts');
const outPath = path.join(dashboardRoot, 'src', 'constants', 'powerImageCatalog.ts');

const failSoft = process.argv.includes('--optional');

if (!fs.existsSync(corePath) || !fs.existsSync(catalogPath)) {
  const message = `Power catalog source not found:\n  ${corePath}\n  ${catalogPath}\nSet HEROIC_RPG_ROOT or place the RPG repo as a sibling of Heroic-Dashboard.`;
  if (failSoft) {
    console.warn(`[sync:power-catalog] Skipped — ${message}`);
    process.exit(0);
  }
  console.error(`[sync:power-catalog] ${message}`);
  process.exit(1);
}

const extractQuotedStrings = (src, exportName) => {
  const start = src.indexOf(`export const ${exportName}`);
  if (start < 0) return [];
  const eq = src.indexOf('=', start);
  const arrStart = src.indexOf('[', eq);
  if (arrStart < 0) return [];

  let depth = 0;
  let end = -1;
  for (let i = arrStart; i < src.length; i++) {
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

  const body = src.slice(arrStart, end + 1);
  const names = [];
  const re = /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = re.exec(body)) !== null) {
    names.push((match[1] || match[2] || '').replace(/\\'/g, "'").replace(/\\"/g, '"'));
  }
  return names;
};

const coreSrc = fs.readFileSync(corePath, 'utf8');
const catalogSrc = fs.readFileSync(catalogPath, 'utf8');

const categories = extractQuotedStrings(catalogSrc, 'POWER_IMAGE_CATEGORIES');
const damageCategories = extractQuotedStrings(catalogSrc, 'POWER_IMAGE_DAMAGE_CATEGORIES');
const damageTypes = extractQuotedStrings(coreSrc, 'DAMAGE_TYPES');
const debuffStatusEffects = extractQuotedStrings(coreSrc, 'DEBUFF_STATUS_EFFECTS');
const statusEffects = debuffStatusEffects.filter(
  (name) => name !== 'Unconscious' && name !== 'Surprised'
);

if (categories.length !== 4 || damageCategories.length === 0 || damageTypes.length === 0 || statusEffects.length === 0) {
  console.error(
    `[sync:power-catalog] Parsed empty catalog (categories=${categories.length}, damageCategories=${damageCategories.length}, damage=${damageTypes.length}, status=${statusEffects.length}). Aborting.`
  );
  process.exit(1);
}

const generatedAt = new Date().toISOString().slice(0, 10);

const catalogTs = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Slim Power Image catalog for Media Library uploads.
 * Source of truth: heroic-ai-rpg/src/constants/powerImageCatalog.ts (categories)
 * and heroic-ai-rpg/src/types/Core.ts (DAMAGE_TYPES, POWER_DEBUFF_STATUS_EFFECTS via DEBUFF minus Unconscious/Surprised).
 *
 * Regenerate:
 *   npm run sync:power-catalog
 *
 * Last synced: ${generatedAt}
 */

export const POWER_IMAGE_CATEGORIES = ${JSON.stringify(categories, null, 2)} as const;

export type PowerImageCategory = (typeof POWER_IMAGE_CATEGORIES)[number];

export const POWER_IMAGE_DAMAGE_SUBTYPES = ${JSON.stringify(damageTypes, null, 2)} as const;

export const POWER_IMAGE_STATUS_SUBTYPES = ${JSON.stringify(statusEffects, null, 2)} as const;

const DAMAGE_CATEGORIES = new Set(${JSON.stringify(damageCategories)});

export const getPowerImageCategoryNames = (): PowerImageCategory[] => [...POWER_IMAGE_CATEGORIES];

export const getPowerImageSubtypes = (category: string): readonly string[] => {
  const match = POWER_IMAGE_CATEGORIES.find(
    (entry) => entry.toLowerCase() === category.trim().toLowerCase()
  );
  if (!match) return [];
  return DAMAGE_CATEGORIES.has(match) ? POWER_IMAGE_DAMAGE_SUBTYPES : POWER_IMAGE_STATUS_SUBTYPES;
};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, catalogTs);

console.log(
  `[sync:power-catalog] Wrote ${categories.length} categories / ${damageTypes.length} damage / ${statusEffects.length} status → ${path.relative(dashboardRoot, outPath)}`
);
console.log(`[sync:power-catalog] Source: ${catalogPath}`);
