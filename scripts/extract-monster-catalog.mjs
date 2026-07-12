import fs from 'fs';

const src = fs.readFileSync(
  'D:/Eric/App/Heroic AI RPG/heroic-ai-rpg/src/constants/monsterTypes.ts',
  'utf8'
);

const start = src.indexOf('export const MONSTER_TYPES');
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
  const name = (obj.match(/name:\s*"([^"]+)"/) || [])[1];
  const description = (obj.match(/description:\s*"([^"]+)"/) || [])[1];
  const subtypesIdx = obj.indexOf('subtypes:');
  const subtypes = [];
  if (subtypesIdx >= 0) {
    const fromSub = obj.slice(subtypesIdx);
    const re =
      /\{\s*name:\s*"([^"]+)",\s*visualDescription:\s*"([^"]+)",[\s\S]*?allowedTerrains:/g;
    let m;
    while ((m = re.exec(fromSub))) {
      subtypes.push({ name: m[1], visualDescription: m[2] });
    }
  }
  if (name) types.push({ name, description, subtypes });
}

console.log(
  JSON.stringify(
    {
      count: types.length,
      subtypes: types.reduce((n, t) => n + t.subtypes.length, 0),
      sample: types[0],
    },
    null,
    2
  )
);

fs.mkdirSync('D:/Eric/App/Heroic-Dashboard/src/constants', { recursive: true });

const catalogTs = `/**
 * Slim monster type/subtype catalog for Media Library Monster Portraits.
 * Source of truth: heroic-ai-rpg/src/constants/monsterTypes.ts — keep in sync when subtypes change.
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

fs.writeFileSync(
  'D:/Eric/App/Heroic-Dashboard/src/constants/monsterPortraitCatalog.ts',
  catalogTs
);
