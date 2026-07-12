/**
 * Regenerates src/constants/monsterPortraitCatalog.ts from the RPG source of truth.
 *
 * Source: ../Heroic AI RPG/heroic-ai-rpg/src/constants/monsterTypes.ts
 * Override with HEROIC_RPG_ROOT if the repos are not siblings.
 *
 * Usage: npm run sync:monster-catalog
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

const sourcePath = path.join(rpgRoot, 'src', 'constants', 'monsterTypes.ts');
const outPath = path.join(dashboardRoot, 'src', 'constants', 'monsterPortraitCatalog.ts');

const failSoft = process.argv.includes('--optional');

if (!fs.existsSync(sourcePath)) {
  const message = `Monster catalog source not found at:\n  ${sourcePath}\nSet HEROIC_RPG_ROOT or place the RPG repo as a sibling of Heroic-Dashboard.`;
  if (failSoft) {
    console.warn(`[sync:monster-catalog] Skipped — ${message}`);
    process.exit(0);
  }
  console.error(`[sync:monster-catalog] ${message}`);
  process.exit(1);
}

const src = fs.readFileSync(sourcePath, 'utf8');

const start = src.indexOf('export const MONSTER_TYPES');
if (start < 0) {
  console.error('[sync:monster-catalog] Could not find export const MONSTER_TYPES in source.');
  process.exit(1);
}

const eq = src.indexOf('=', start);
const arrStart = src.indexOf('[', eq);
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

if (end < 0) {
  console.error('[sync:monster-catalog] Could not parse MONSTER_TYPES array bounds.');
  process.exit(1);
}

const body = src.slice(arrStart, end + 1);
const types = [];
let i = 1;

while (i < body.length) {
  while (i < body.length && (body[i] === ',' || /\s/.test(body[i]))) i++;
  if (body[i] === ']') break;
  if (body[i] !== '{') {
    i++;
    continue;
  }

  let d = 0;
  const s = i;
  for (; i < body.length; i++) {
    if (body[i] === '{') d++;
    else if (body[i] === '}') {
      d--;
      if (d === 0) {
        i++;
        break;
      }
    }
  }

  const obj = body.slice(s, i);
  const name = (obj.match(/name:\s*"((?:\\.|[^"\\])*)"/) || [])[1];
  const description = (obj.match(/description:\s*"((?:\\.|[^"\\])*)"/) || [])[1];
  const subtypesIdx = obj.indexOf('subtypes:');
  const subtypes = [];

  if (subtypesIdx >= 0) {
    const fromSub = obj.slice(subtypesIdx);
    const re =
      /\{\s*name:\s*"((?:\\.|[^"\\])*)",\s*visualDescription:\s*"((?:\\.|[^"\\])*)",[\s\S]*?allowedTerrains:/g;
    let m;
    while ((m = re.exec(fromSub))) {
      subtypes.push({
        name: JSON.parse(`"${m[1]}"`),
        visualDescription: JSON.parse(`"${m[2]}"`),
      });
    }
  }

  if (name) {
    types.push({
      name: JSON.parse(`"${name}"`),
      description: description ? JSON.parse(`"${description}"`) : '',
      subtypes,
    });
  }
}

const typeCount = types.length;
const subtypeCount = types.reduce((n, t) => n + t.subtypes.length, 0);

if (typeCount === 0 || subtypeCount === 0) {
  console.error(
    `[sync:monster-catalog] Parsed empty catalog (types=${typeCount}, subtypes=${subtypeCount}). Aborting.`
  );
  process.exit(1);
}

const generatedAt = new Date().toISOString().slice(0, 10);

const catalogTs = `/**
 * AUTO-GENERATED — do not edit by hand.
 *
 * Slim monster type/subtype catalog for Media Library Monster Portraits.
 * Source of truth: heroic-ai-rpg/src/constants/monsterTypes.ts
 *
 * Regenerate:
 *   npm run sync:monster-catalog
 *
 * Last synced: ${generatedAt}
 */

export interface MonsterPortraitSubtype {
  readonly name: string;
  readonly visualDescription: string;
}

export interface MonsterPortraitType {
  readonly name: string;
  readonly description: string;
  readonly subtypes: readonly MonsterPortraitSubtype[];
}

export const MONSTER_PORTRAIT_CATALOG: readonly MonsterPortraitType[] = ${JSON.stringify(types, null, 2)} as const;

export const getMonsterTypeNames = (): string[] =>
  MONSTER_PORTRAIT_CATALOG.map((entry) => entry.name);

export const getMonsterSubtypes = (typeName: string): readonly MonsterPortraitSubtype[] => {
  const match = MONSTER_PORTRAIT_CATALOG.find(
    (entry) => entry.name.toLowerCase() === typeName.trim().toLowerCase()
  );
  return match?.subtypes ?? [];
};

export const getMonsterSubtypeDescription = (typeName: string, subtypeName: string): string => {
  const subtype = getMonsterSubtypes(typeName).find(
    (entry) => entry.name.toLowerCase() === subtypeName.trim().toLowerCase()
  );
  return subtype?.visualDescription ?? '';
};
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, catalogTs);

console.log(
  `[sync:monster-catalog] Wrote ${typeCount} types / ${subtypeCount} subtypes → ${path.relative(dashboardRoot, outPath)}`
);
console.log(`[sync:monster-catalog] Source: ${sourcePath}`);
