/**
 * Regenerates src/constants/rideablePortraitCatalog.ts from the RPG source of truth.
 *
 * Source: ../Heroic AI RPG/heroic-ai-rpg/src/constants/rideableCatalog.ts
 * Override with HEROIC_RPG_ROOT if the repos are not siblings.
 *
 * Usage: npm run sync:rideable-catalog
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

const sourcePath = path.join(rpgRoot, 'src', 'constants', 'rideableCatalog.ts');
const outPath = path.join(dashboardRoot, 'src', 'constants', 'rideablePortraitCatalog.ts');

const failSoft = process.argv.includes('--optional');

if (!fs.existsSync(sourcePath)) {
  const message = `Rideable catalog source not found at:\n  ${sourcePath}\nSet HEROIC_RPG_ROOT or place the RPG repo as a sibling of Heroic-Dashboard.`;
  if (failSoft) {
    console.warn(`[sync:rideable-catalog] Skipped — ${message}`);
    process.exit(0);
  }
  console.error(`[sync:rideable-catalog] ${message}`);
  process.exit(1);
}

const src = fs.readFileSync(sourcePath, 'utf8');

const start = src.indexOf('export const RIDEABLE_CATALOG');
if (start < 0) {
  console.error('[sync:rideable-catalog] Could not find export const RIDEABLE_CATALOG in source.');
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
  console.error('[sync:rideable-catalog] Could not parse RIDEABLE_CATALOG array bounds.');
  process.exit(1);
}

const body = src.slice(arrStart, end + 1);
const entries = [];
const nameRe = /name:\s*((?:'((?:\\'|[^'])*)')|(?:"((?:\\"|[^"])*)"))/g;
const categoryRe = /category:\s*'(mount|vehicle|ship)'/;
const genreRe = /genre:\s*'(Fantasy|Modern|Sci-Fi)'/;

// Split on top-level objects by finding `{` ... `},` blocks with brace depth
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
  const block = body.slice(s, i);
  const nameMatch = nameRe.exec(block);
  nameRe.lastIndex = 0;
  const categoryMatch = categoryRe.exec(block);
  const genreMatch = genreRe.exec(block);
  if (!nameMatch || !categoryMatch || !genreMatch) continue;
  const name = (nameMatch[2] ?? nameMatch[3] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"');
  entries.push({
    name,
    category: categoryMatch[1],
    genre: genreMatch[1],
  });
}

if (entries.length === 0) {
  console.error('[sync:rideable-catalog] Parsed zero rideable entries.');
  process.exit(1);
}

const byGenre = {
  Fantasy: { mount: [], vehicle: [], ship: [] },
  Modern: { mount: [], vehicle: [], ship: [] },
  'Sci-Fi': { mount: [], vehicle: [], ship: [] },
};

for (const entry of entries) {
  byGenre[entry.genre][entry.category].push(entry.name);
}

/**
 * RIDEABLE_IMAGE_DESCRIPTIONS: { Fantasy: { 'Name': 'Looks like ...' }, ... }.
 * Image-generation reference for the admin upload form only.
 */
const extractImageDescriptions = () => {
  const result = { Fantasy: new Map(), Modern: new Map(), 'Sci-Fi': new Map() };
  const root = /export\s+const\s+RIDEABLE_IMAGE_DESCRIPTIONS\s*(?::[^=]+)?=\s*\{/m.exec(src);
  if (!root) return result;
  const sliceBraces = (text, openIndex) => {
    let d = 0;
    for (let k = openIndex; k < text.length; k++) {
      if (text[k] === '{') d++;
      else if (text[k] === '}') {
        d--;
        if (d === 0) return text.slice(openIndex, k + 1);
      }
    }
    return '';
  };
  const rootBody = sliceBraces(src, root.index + root[0].length - 1);
  const quoted = `(?:'((?:\\\\'|[^'])*)'|"((?:\\\\"|[^"])*)")`;
  const unescape = (s) => s.replace(/\\(['"])/g, '$1');
  for (const genre of Object.keys(result)) {
    const keyPattern = genre === 'Sci-Fi' ? `['"]Sci-Fi['"]` : `['"]?${genre}['"]?`;
    const genreMatch = new RegExp(`${keyPattern}\\s*:\\s*\\{`).exec(rootBody);
    if (!genreMatch) continue;
    const block = sliceBraces(rootBody, genreMatch.index + genreMatch[0].length - 1);
    const entryRe = new RegExp(`${quoted}\\s*:\\s*${quoted}`, 'g');
    let entry;
    while ((entry = entryRe.exec(block)) !== null) {
      const name = unescape(entry[1] ?? entry[2] ?? '').trim();
      const sentence = unescape(entry[3] ?? entry[4] ?? '').trim();
      if (name && sentence) result[genre].set(name, sentence);
    }
  }
  return result;
};

const imageDescriptionsByGenre = extractImageDescriptions();
for (const genre of Object.keys(byGenre)) {
  const names = new Set([...byGenre[genre].mount, ...byGenre[genre].vehicle, ...byGenre[genre].ship]);
  const descriptions = imageDescriptionsByGenre[genre];
  const missing = [...names].filter((name) => !descriptions.has(name));
  const extra = [...descriptions.keys()].filter((name) => !names.has(name));
  if (missing.length > 0 || extra.length > 0) {
    console.error(
      `[sync:rideable-catalog] Genre "${genre}" image descriptions do not match the catalog (missing: ${
        missing.join(', ') || 'none'
      }; not in catalog: ${extra.join(', ') || 'none'}). Aborting.`
    );
    process.exit(1);
  }
}

const quote = (s) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const serializeList = (list) =>
  list.length === 0 ? '[]' : `[\n${list.map((n) => `    '${n.replace(/'/g, "\\'")}',`).join('\n')}\n  ]`;

const serializeDescriptions = (genre) => {
  const rows = [...imageDescriptionsByGenre[genre].entries()].map(
    ([name, sentence]) => `    ${quote(name)}: ${quote(sentence)},`
  );
  return `{\n${rows.join('\n')}\n  }`;
};

const file = `/**
 * AUTO-GENERATED by scripts/extract-rideable-catalog.mjs — do not edit by hand.
 * Source: heroic-ai-rpg/src/constants/rideableCatalog.ts
 * Sync: npm run sync:rideable-catalog
 */

export type RideablePortraitGenre = 'Fantasy' | 'Modern' | 'Sci-Fi';
export type RideablePortraitCategory = 'mount' | 'vehicle' | 'ship';

export const RIDEABLE_PORTRAIT_CATALOG: Record<
  RideablePortraitGenre,
  Record<RideablePortraitCategory, readonly string[]>
> = {
  Fantasy: {
    mount: ${serializeList(byGenre.Fantasy.mount)},
    vehicle: ${serializeList(byGenre.Fantasy.vehicle)},
    ship: ${serializeList(byGenre.Fantasy.ship)},
  },
  Modern: {
    mount: ${serializeList(byGenre.Modern.mount)},
    vehicle: ${serializeList(byGenre.Modern.vehicle)},
    ship: ${serializeList(byGenre.Modern.ship)},
  },
  'Sci-Fi': {
    mount: ${serializeList(byGenre['Sci-Fi'].mount)},
    vehicle: ${serializeList(byGenre['Sci-Fi'].vehicle)},
    ship: ${serializeList(byGenre['Sci-Fi'].ship)},
  },
};

export const getRideableTypeSuggestions = (
  genre: RideablePortraitGenre,
  category: RideablePortraitCategory
): readonly string[] => RIDEABLE_PORTRAIT_CATALOG[genre]?.[category] ?? [];

/** Rideable template name → "Looks like …" sentence. Image-generation reference only. */
export const RIDEABLE_IMAGE_DESCRIPTION_BY_GENRE: Readonly<
  Record<RideablePortraitGenre, Readonly<Record<string, string>>>
> = {
  Fantasy: ${serializeDescriptions('Fantasy')},
  Modern: ${serializeDescriptions('Modern')},
  'Sci-Fi': ${serializeDescriptions('Sci-Fi')},
};

/** Looks up the selected genre first, then any genre (names are unique across the catalog). */
export const getRideableImageDescription = (
  name: string,
  genre?: RideablePortraitGenre | null
): string => {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  if (genre && RIDEABLE_IMAGE_DESCRIPTION_BY_GENRE[genre]?.[trimmed]) {
    return RIDEABLE_IMAGE_DESCRIPTION_BY_GENRE[genre][trimmed];
  }
  for (const byName of Object.values(RIDEABLE_IMAGE_DESCRIPTION_BY_GENRE)) {
    if (byName[trimmed]) return byName[trimmed];
  }
  return '';
};
`;

fs.writeFileSync(outPath, file);
console.log(
  `[sync:rideable-catalog] Wrote ${entries.length} entries to ${path.relative(dashboardRoot, outPath)}`
);
