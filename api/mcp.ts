import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Single-file Vercel Node function, matching api/clerk-proxy.ts:
 * type-only @vercel/node import, no local runtime imports, no Node crypto builtin.
 * Files under api/lib were being treated as extra functions and ESM imports
 * crashed cold start (FUNCTION_INVOCATION_FAILED on OPTIONS and POST).
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

const DEFAULT_MCP_PROTOCOL_VERSION = '2025-03-26';
const MCP_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'] as const;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID, Accept',
  'Access-Control-Expose-Headers': 'MCP-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

function applyCors(response: VercelResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.setHeader(key, value);
  }
  response.setHeader('MCP-Protocol-Version', DEFAULT_MCP_PROTOCOL_VERSION);
}

function sendJson(response: VercelResponse, status: number, payload: unknown) {
  return response.status(status).json(payload);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  applyCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

  return handleMcpRequest(request, response);
}

async function handleMcpRequest(request: VercelRequest, response: VercelResponse) {
  const mcpApiKey = process.env.MCP_API_KEY;
  if (!mcpApiKey) {
    return sendJson(response, 500, { error: 'MCP Server Is Not Configured.' });
  }

  if (!isAuthorizedMcpRequest(request.headers.authorization, mcpApiKey)) {
    response.setHeader('WWW-Authenticate', 'Bearer realm="mcp"');
    return sendJson(response, 401, { error: 'Unauthorized.' });
  }

  if (request.method === 'GET' || request.method === 'DELETE') {
    response.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(response, 405, { error: 'Method Not Allowed. Use POST For MCP JSON-RPC.' });
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(response, 405, { error: 'Method Not Allowed.' });
  }

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch {
    return sendJson(response, 400, {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse Error.' },
    });
  }

  const result = await dispatchMcpMessage(body);
  if (result.kind === 'empty') {
    return response.status(202).end();
  }
  if (result.kind === 'batch') {
    return sendRpc(request, response, result.responses);
  }
  return sendRpc(request, response, result.response);
}

async function readJsonBody(request: VercelRequest): Promise<unknown> {
  if (request.body !== undefined && request.body !== null && request.body !== '') {
    if (Buffer.isBuffer(request.body)) {
      const text = request.body.toString('utf8');
      return text ? JSON.parse(text) : undefined;
    }
    if (typeof request.body === 'string') {
      return request.body ? JSON.parse(request.body) : undefined;
    }
    return request.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return undefined;
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : undefined;
}

function wantsSse(request: VercelRequest): boolean {
  const accept = String(request.headers.accept || '');
  return accept.includes('text/event-stream') && !accept.includes('application/json');
}

function sendRpc(request: VercelRequest, response: VercelResponse, payload: unknown) {
  if (wantsSse(request)) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    const messages = Array.isArray(payload) ? payload : [payload];
    for (const message of messages) {
      response.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
    }
    return response.end();
  }
  return sendJson(response, 200, payload);
}

function asHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function extractBearerToken(
  authorization: string | string[] | undefined
): string | null {
  const header = asHeaderValue(authorization);
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

function timingSafeEqualString(left: string, right: string): boolean {
  const len = Math.max(left.length, right.length);
  let mismatch = left.length === right.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const a = i < left.length ? left.charCodeAt(i) : 0;
    const b = i < right.length ? right.charCodeAt(i) : 0;
    mismatch |= a ^ b;
  }
  return mismatch === 0;
}

export function isAuthorizedMcpRequest(
  authorization: string | string[] | undefined,
  expectedKey: string | undefined
): boolean {
  if (!expectedKey) return false;
  const token = extractBearerToken(authorization);
  if (!token) return false;
  return timingSafeEqualString(token, expectedKey);
}

export interface PublishPatchNoteInput {
  title: string;
  content: string;
  version?: string;
}

export interface PatchNotePayload {
  title: string;
  content: string;
  imageUrl: null;
  published: true;
  is_popup: false;
  active: false;
  highlights: [];
  cta_label: null;
  cta_url: null;
  version: string | null;
  is_patch_note: true;
}

export interface PatchNoteListItem {
  id?: string;
  title?: string;
  content?: string;
  version?: string | null;
  createdAt?: string;
  [key: string]: unknown;
}

function requireTrimmed(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} Is Required.`);
  }
  return value.trim();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function buildPatchNotePayload(input: PublishPatchNoteInput): PatchNotePayload {
  const title = requireTrimmed(input.title, 'Title');
  const content = requireTrimmed(input.content, 'Content');
  const version =
    typeof input.version === 'string' && input.version.trim() ? input.version.trim() : null;

  return {
    title,
    content,
    imageUrl: null,
    published: true,
    is_popup: false,
    active: false,
    highlights: [],
    cta_label: null,
    cta_url: null,
    version,
    is_patch_note: true,
  };
}

export function normalizePatchNotesList(data: unknown): PatchNoteListItem[] {
  if (Array.isArray(data)) return data as PatchNoteListItem[];
  if (data && typeof data === 'object') {
    const record = data as { patchNotes?: unknown; news?: unknown; items?: unknown };
    if (Array.isArray(record.patchNotes)) return record.patchNotes as PatchNoteListItem[];
    if (Array.isArray(record.news)) return record.news as PatchNoteListItem[];
    if (Array.isArray(record.items)) return record.items as PatchNoteListItem[];
  }
  return [];
}

export function sortPatchNotesNewestFirst(items: PatchNoteListItem[]): PatchNoteListItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(String(a.createdAt || '')) || 0;
    const bTime = Date.parse(String(b.createdAt || '')) || 0;
    return bTime - aTime;
  });
}

export const MONSTER_GENRES = ['Fantasy', 'Modern', 'Sci-Fi'] as const;
export type MonsterGenre = (typeof MONSTER_GENRES)[number];

export interface MonsterMaturityPrefix {
  minLevel: number;
  prefix: string;
}

export interface MonsterTypeAttributes {
  name?: string;
  description?: string;
  genres?: string[];
  minEncounterLevel?: number;
  defaultArchetype?: string;
  allowedArchetypes?: string[];
  maturityPrefixes?: MonsterMaturityPrefix[];
  immunities?: string[];
  resistances?: string[];
  vulnerabilities?: string[];
  statusImmunities?: string[];
  defaultAffinity?: string | null;
  poiTags?: string[];
  enabled?: boolean;
}

export interface MonsterSubtypeAttributes {
  name?: string;
  visualDescription?: string;
  size?: string;
  archetype?: string | null;
  allowedTerrains?: string[];
  encounterExcluded?: boolean;
  rideable?: boolean;
  affinityOverride?: string | null;
  acquisition?: unknown;
  enabled?: boolean;
}

export function requireCatalogId(value: unknown, field: string): string {
  const id = requireTrimmed(value, field);
  if (/[/?#]/.test(id)) {
    throw new Error(`${field} Is Invalid.`);
  }
  return id;
}

function optionalTrimmedString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${field} Must Be A String.`);
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalNullableString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new Error(`${field} Must Be A String Or Null.`);
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new Error(`${field} Must Be A Boolean.`);
  }
  return value;
}

function optionalFiniteNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} Must Be A Number.`);
  }
  return value;
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${field} Must Be An Array Of Strings.`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function optionalGenres(value: unknown): string[] | undefined {
  const genres = optionalStringArray(value, 'Genres');
  if (!genres) return undefined;
  const invalid = genres.find((genre) => !MONSTER_GENRES.includes(genre as MonsterGenre));
  if (invalid) {
    throw new Error(`Genre Must Be One Of ${MONSTER_GENRES.join(', ')}.`);
  }
  return genres;
}

function optionalMaturityPrefixes(value: unknown): MonsterMaturityPrefix[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error('Maturity Prefixes Must Be An Array.');
  }
  return value.map((item, index) => {
    const record = asRecord(item);
    const minLevel = optionalFiniteNumber(record.minLevel, `Maturity Prefixes[${index}].minLevel`);
    const prefix = optionalTrimmedString(record.prefix, `Maturity Prefixes[${index}].prefix`);
    if (minLevel === undefined || !prefix) {
      throw new Error(`Maturity Prefixes[${index}] Requires minLevel And prefix.`);
    }
    return { minLevel, prefix };
  });
}

function assignDefined<T extends object>(
  target: T,
  entries: Record<string, unknown>
): T {
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
  return target;
}

export function parseMonsterTypeAttributes(input: unknown): MonsterTypeAttributes {
  const record = asRecord(input);
  return assignDefined({} as MonsterTypeAttributes, {
    name: optionalTrimmedString(record.name, 'Name'),
    description: optionalTrimmedString(record.description, 'Description'),
    genres: optionalGenres(record.genres),
    minEncounterLevel: optionalFiniteNumber(record.minEncounterLevel, 'Min Encounter Level'),
    defaultArchetype: optionalTrimmedString(record.defaultArchetype, 'Default Archetype'),
    allowedArchetypes: optionalStringArray(record.allowedArchetypes, 'Allowed Archetypes'),
    maturityPrefixes: optionalMaturityPrefixes(record.maturityPrefixes),
    immunities: optionalStringArray(record.immunities, 'Immunities'),
    resistances: optionalStringArray(record.resistances, 'Resistances'),
    vulnerabilities: optionalStringArray(record.vulnerabilities, 'Vulnerabilities'),
    statusImmunities: optionalStringArray(record.statusImmunities, 'Status Immunities'),
    defaultAffinity: optionalNullableString(record.defaultAffinity, 'Default Affinity'),
    poiTags: optionalStringArray(record.poiTags, 'POI Tags'),
    enabled: optionalBoolean(record.enabled, 'Enabled'),
  });
}

export function parseMonsterSubtypeAttributes(input: unknown): MonsterSubtypeAttributes {
  const record = asRecord(input);
  return assignDefined({} as MonsterSubtypeAttributes, {
    name: optionalTrimmedString(record.name, 'Name'),
    visualDescription: optionalTrimmedString(record.visualDescription, 'Visual Description'),
    size: optionalTrimmedString(record.size, 'Size'),
    archetype: optionalNullableString(record.archetype, 'Archetype'),
    allowedTerrains: optionalStringArray(record.allowedTerrains, 'Allowed Terrains'),
    encounterExcluded: optionalBoolean(record.encounterExcluded, 'Encounter Excluded'),
    rideable: optionalBoolean(record.rideable, 'Rideable'),
    affinityOverride: optionalNullableString(record.affinityOverride, 'Affinity Override'),
    acquisition: record.acquisition === undefined ? undefined : record.acquisition,
    enabled: optionalBoolean(record.enabled, 'Enabled'),
  });
}

export function buildMonsterTypeCreatePayload(input: unknown): Record<string, unknown> {
  const attributes = parseMonsterTypeAttributes(input);
  const name = attributes.name;
  const description = attributes.description;
  if (!name) throw new Error('Name Is Required.');
  if (!description) throw new Error('Description Is Required.');

  return assignDefined(
    {
      name,
      description,
      genres: attributes.genres?.length ? attributes.genres : ['Fantasy'],
      minEncounterLevel: attributes.minEncounterLevel ?? 1,
    } as Record<string, unknown>,
    {
      defaultArchetype: attributes.defaultArchetype,
      allowedArchetypes: attributes.allowedArchetypes,
      maturityPrefixes: attributes.maturityPrefixes,
      immunities: attributes.immunities,
      resistances: attributes.resistances,
      vulnerabilities: attributes.vulnerabilities,
      statusImmunities: attributes.statusImmunities,
      defaultAffinity: attributes.defaultAffinity,
      poiTags: attributes.poiTags,
      enabled: attributes.enabled ?? true,
    }
  );
}

export function buildMonsterTypeUpdatePayload(input: unknown): Record<string, unknown> {
  const attributes = parseMonsterTypeAttributes(input);
  const payload = assignDefined({} as Record<string, unknown>, attributes as Record<string, unknown>);
  if (Object.keys(payload).length === 0) {
    throw new Error('At Least One Type Attribute Is Required.');
  }
  return payload;
}

export function buildMonsterSubtypeCreatePayload(input: unknown): Record<string, unknown> {
  const attributes = parseMonsterSubtypeAttributes(input);
  if (!attributes.name) throw new Error('Name Is Required.');
  if (!attributes.visualDescription) throw new Error('Visual Description Is Required.');

  return assignDefined(
    {
      name: attributes.name,
      visualDescription: attributes.visualDescription,
      size: attributes.size || 'Medium',
      allowedTerrains: attributes.allowedTerrains?.length ? attributes.allowedTerrains : ['Plains'],
      encounterExcluded: attributes.encounterExcluded ?? false,
      rideable: attributes.rideable ?? false,
      enabled: attributes.enabled ?? true,
    } as Record<string, unknown>,
    {
      archetype: attributes.archetype ?? null,
      affinityOverride: attributes.affinityOverride,
      acquisition: attributes.acquisition,
    }
  );
}

export function buildMonsterSubtypeUpdatePayload(input: unknown): Record<string, unknown> {
  const attributes = parseMonsterSubtypeAttributes(input);
  const payload = assignDefined({} as Record<string, unknown>, attributes as Record<string, unknown>);
  if (Object.keys(payload).length === 0) {
    throw new Error('At Least One Subtype Attribute Is Required.');
  }
  return payload;
}

export function normalizeMonsterTypesList(data: unknown): { types: unknown[] } {
  if (Array.isArray(data)) return { types: data };
  if (data && typeof data === 'object') {
    const record = data as { types?: unknown };
    if (Array.isArray(record.types)) return { types: record.types };
  }
  return { types: [] };
}

function getRpgApiUrl(): string {
  return (process.env.RPG_API_URL || process.env.VITE_RPG_API_URL || '').replace(/\/$/, '');
}

function getAdminApiKey(): string {
  return process.env.ADMIN_API_KEY || '';
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

function errorFromPayload(status: number, data: unknown): Error {
  const payload = data as { error?: string; message?: string };
  const detail = [payload.error, payload.message].filter(Boolean).join(' — ');
  return new Error(detail || `Server Returned Status ${status}`);
}

async function fetchRpgAdminServer<T>(path: string, init?: RequestInit): Promise<T> {
  const apiUrl = getRpgApiUrl();
  if (!apiUrl) {
    throw new Error('RPG_API_URL is not configured.');
  }

  const adminKey = getAdminApiKey();
  if (!adminKey) {
    throw new Error('ADMIN_API_KEY is not configured.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${normalizedPath}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${adminKey}`,
        'x-admin-key': adminKey,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network error';
    throw new Error(
      `Could not reach RPG API at ${apiUrl} (${detail}). Confirm RPG_API_URL and that the RPG server is running.`
    );
  }

  const data = await parseJson(response);
  const payload = data as { error?: string };

  if (!response.ok) {
    throw errorFromPayload(response.status, data);
  }

  if (payload.error) {
    throw new Error(payload.error);
  }

  return data as T;
}

async function fetchRpgPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const apiUrl = getRpgApiUrl();
  if (!apiUrl) {
    throw new Error('RPG_API_URL is not configured.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${normalizedPath}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network error';
    throw new Error(
      `Could not reach RPG API at ${apiUrl} (${detail}). Confirm RPG_API_URL and that the RPG server is running.`
    );
  }

  const data = await parseJson(response);
  if (!response.ok) {
    throw errorFromPayload(response.status, data);
  }

  return data as T;
}

export const MCP_SERVER_INFO = {
  name: 'heroic-dashboard',
  version: '1.0.0',
  title: 'Heroic Dashboard',
};

export type JsonSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties: boolean;
};

export type McpToolDefinition = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
};

const MONSTER_TYPE_ATTRIBUTE_PROPERTIES: Record<string, unknown> = {
  name: { type: 'string', description: 'Monster type name.' },
  description: { type: 'string', description: 'Monster type description.' },
  genres: {
    type: 'array',
    items: { type: 'string', enum: [...MONSTER_GENRES] },
    description: 'Genres this type appears in: Fantasy, Modern, Sci-Fi.',
  },
  minEncounterLevel: { type: 'number', description: 'Minimum encounter level.' },
  defaultArchetype: { type: 'string', description: 'Default combat archetype.' },
  allowedArchetypes: {
    type: 'array',
    items: { type: 'string' },
    description: 'Allowed combat archetypes.',
  },
  maturityPrefixes: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        minLevel: { type: 'number' },
        prefix: { type: 'string' },
      },
      required: ['minLevel', 'prefix'],
      additionalProperties: false,
    },
    description: 'Level-gated name prefixes, e.g. Young / Elder.',
  },
  immunities: { type: 'array', items: { type: 'string' }, description: 'Damage immunities.' },
  resistances: { type: 'array', items: { type: 'string' }, description: 'Damage resistances.' },
  vulnerabilities: { type: 'array', items: { type: 'string' }, description: 'Damage vulnerabilities.' },
  statusImmunities: { type: 'array', items: { type: 'string' }, description: 'Status immunities.' },
  defaultAffinity: {
    type: ['string', 'null'],
    description: 'Default elemental affinity, or null.',
  },
  poiTags: { type: 'array', items: { type: 'string' }, description: 'POI / biome tags.' },
  enabled: { type: 'boolean', description: 'Whether the type is enabled.' },
};

const MONSTER_SUBTYPE_ATTRIBUTE_PROPERTIES: Record<string, unknown> = {
  name: { type: 'string', description: 'Subtype name.' },
  visualDescription: { type: 'string', description: 'Visual description used for portraits and prompts.' },
  size: { type: 'string', description: 'Size class, e.g. Medium, Huge.' },
  archetype: { type: ['string', 'null'], description: 'Archetype override, or null to inherit the type.' },
  allowedTerrains: {
    type: 'array',
    items: { type: 'string' },
    description: 'Terrains this subtype can appear in.',
  },
  encounterExcluded: { type: 'boolean', description: 'Exclude from random encounters.' },
  rideable: { type: 'boolean', description: 'Whether this subtype is rideable.' },
  affinityOverride: { type: ['string', 'null'], description: 'Affinity override, or null.' },
  acquisition: { description: 'Optional acquisition / unlock payload from the game CMS.' },
  enabled: { type: 'boolean', description: 'Whether the subtype is enabled.' },
};

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'get_insights',
    description:
      'Return a JSON snapshot of the same live analytics AdminAnalytics shows: active users and sessions, feature usage, model mix, and API cost. Aggregates RPG admin GETs (overview, session length, feature usage, cost/model).',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'publish_patch_note',
    description:
      'Create a published patch note via POST /api/admin/news. Sets is_patch_note true and published true. Does not enable is_popup.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Patch note title.',
        },
        content: {
          type: 'string',
          description: 'Patch note body (HTML or markdown as used in the CMS).',
        },
        version: {
          type: 'string',
          description: 'Optional app version label, e.g. v0.62.',
        },
      },
      required: ['title', 'content'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_patch_notes',
    description:
      'List published patch notes from the public GET /api/patch-notes endpoint, newest first.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'list_monster_types',
    description:
      'List monster types with subtypes and attributes from the game CMS via GET /api/admin/monster-types?includeSubtypes=1. Does not maintain a local bestiary.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_monster_type',
    description:
      'Get one monster type and its subtypes from the game CMS via GET /api/admin/monster-types/:id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Monster type id.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_monster_type',
    description:
      'Create a monster type via POST /api/admin/monster-types. Name and description are required. Copy combat identity (archetypes, immunities, POI tags) from list_monster_types when adding a sibling type.',
    inputSchema: {
      type: 'object',
      properties: MONSTER_TYPE_ATTRIBUTE_PROPERTIES,
      required: ['name', 'description'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_monster_type',
    description:
      'Update an existing monster type via PATCH /api/admin/monster-types/:id. Send only the attributes to change.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Monster type id.' },
        ...MONSTER_TYPE_ATTRIBUTE_PROPERTIES,
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'create_monster_subtype',
    description:
      'Create a subtype under a type via POST /api/admin/monster-types/:id/subtypes. Name and visualDescription are required.',
    inputSchema: {
      type: 'object',
      properties: {
        typeId: { type: 'string', description: 'Parent monster type id.' },
        ...MONSTER_SUBTYPE_ATTRIBUTE_PROPERTIES,
      },
      required: ['typeId', 'name', 'visualDescription'],
      additionalProperties: false,
    },
  },
  {
    name: 'update_monster_subtype',
    description:
      'Update a subtype via PATCH /api/admin/monster-types/:id/subtypes/:subtypeId. Send only the attributes to change.',
    inputSchema: {
      type: 'object',
      properties: {
        typeId: { type: 'string', description: 'Parent monster type id.' },
        subtypeId: { type: 'string', description: 'Monster subtype id.' },
        ...MONSTER_SUBTYPE_ATTRIBUTE_PROPERTIES,
      },
      required: ['typeId', 'subtypeId'],
      additionalProperties: false,
    },
  },
];

export type RpgAdminFetch = (path: string, init?: RequestInit) => Promise<unknown>;

export type McpToolRuntime = {
  getInsights?: () => Promise<unknown>;
  publishPatchNote?: (payload: PatchNotePayload) => Promise<unknown>;
  listPatchNotes?: () => Promise<unknown>;
  fetchRpgAdmin?: RpgAdminFetch;
};

async function defaultGetInsights() {
  return fetchAnalyticsInsights((path) => fetchRpgAdminServer(path));
}

async function defaultPublishPatchNote(payload: PatchNotePayload) {
  return fetchRpgAdminServer('/api/admin/news', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function defaultListPatchNotes() {
  const data = await fetchRpgPublic<unknown>('/api/patch-notes');
  return sortPatchNotesNewestFirst(normalizePatchNotesList(data));
}

function rpgAdminFetch(runtime: McpToolRuntime): RpgAdminFetch {
  return runtime.fetchRpgAdmin || ((path, init) => fetchRpgAdminServer(path, init));
}

export async function executeMcpTool(
  name: string,
  args: unknown,
  runtime: McpToolRuntime = {}
): Promise<unknown> {
  const getInsights = runtime.getInsights || defaultGetInsights;
  const publishPatchNote = runtime.publishPatchNote || defaultPublishPatchNote;
  const listPatchNotes = runtime.listPatchNotes || defaultListPatchNotes;
  const fetchRpgAdmin = rpgAdminFetch(runtime);

  if (name === 'get_insights') {
    return getInsights();
  }

  if (name === 'publish_patch_note') {
    const record = asRecord(args);
    const input: PublishPatchNoteInput = {
      title: typeof record.title === 'string' ? record.title : '',
      content: typeof record.content === 'string' ? record.content : '',
      version: typeof record.version === 'string' ? record.version : undefined,
    };
    const payload = buildPatchNotePayload(input);
    const created = await publishPatchNote(payload);
    return { ok: true, payload, result: created };
  }

  if (name === 'list_patch_notes') {
    return listPatchNotes();
  }

  if (name === 'list_monster_types') {
    const data = await fetchRpgAdmin('/api/admin/monster-types?includeSubtypes=1');
    return normalizeMonsterTypesList(data);
  }

  if (name === 'get_monster_type') {
    const id = requireCatalogId(asRecord(args).id, 'Id');
    return fetchRpgAdmin(`/api/admin/monster-types/${encodeURIComponent(id)}`);
  }

  if (name === 'create_monster_type') {
    const payload = buildMonsterTypeCreatePayload(args);
    const created = await fetchRpgAdmin('/api/admin/monster-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { ok: true, payload, result: created };
  }

  if (name === 'update_monster_type') {
    const record = asRecord(args);
    const id = requireCatalogId(record.id, 'Id');
    const payload = buildMonsterTypeUpdatePayload(args);
    delete payload.id;
    const updated = await fetchRpgAdmin(`/api/admin/monster-types/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return { ok: true, id, payload, result: updated };
  }

  if (name === 'create_monster_subtype') {
    const record = asRecord(args);
    const typeId = requireCatalogId(record.typeId, 'Type Id');
    const payload = buildMonsterSubtypeCreatePayload(args);
    delete payload.typeId;
    const created = await fetchRpgAdmin(
      `/api/admin/monster-types/${encodeURIComponent(typeId)}/subtypes`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return { ok: true, typeId, payload, result: created };
  }

  if (name === 'update_monster_subtype') {
    const record = asRecord(args);
    const typeId = requireCatalogId(record.typeId, 'Type Id');
    const subtypeId = requireCatalogId(record.subtypeId, 'Subtype Id');
    const payload = buildMonsterSubtypeUpdatePayload(args);
    delete payload.typeId;
    delete payload.subtypeId;
    const updated = await fetchRpgAdmin(
      `/api/admin/monster-types/${encodeURIComponent(typeId)}/subtypes/${encodeURIComponent(subtypeId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
    return { ok: true, typeId, subtypeId, payload, result: updated };
  }

  throw new Error(`Unknown Tool: ${name}`);
}

export function negotiateProtocolVersion(requested: unknown): string {
  if (
    typeof requested === 'string' &&
    MCP_PROTOCOL_VERSIONS.includes(requested as (typeof MCP_PROTOCOL_VERSIONS)[number])
  ) {
    return requested;
  }
  return DEFAULT_MCP_PROTOCOL_VERSION;
}

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export type McpDispatchResult =
  | { kind: 'empty' }
  | { kind: 'response'; response: JsonRpcResponse }
  | { kind: 'batch'; responses: JsonRpcResponse[] };

const JSONRPC_PARSE = -32700;
const JSONRPC_INVALID_REQUEST = -32600;
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_INVALID_PARAMS = -32602;
const JSONRPC_INTERNAL = -32603;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asParams(value: unknown): Record<string, unknown> {
  return isObject(value) ? value : {};
}

function rpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: data === undefined ? { code, message } : { code, message, data },
  };
}

function rpcResult(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function isNotification(message: JsonRpcRequest): boolean {
  return !('id' in message) || message.id === undefined;
}

function toolTextResult(payload: unknown, isError = false) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  return {
    content: [{ type: 'text', text }],
    isError,
  };
}

async function handleSingle(
  message: JsonRpcRequest,
  runtime: McpToolRuntime
): Promise<JsonRpcResponse | null> {
  if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    const id = 'id' in message ? (message.id as JsonRpcId) : null;
    return rpcError(id, JSONRPC_INVALID_REQUEST, 'Invalid JSON-RPC Request.');
  }

  if (isNotification(message)) {
    return null;
  }

  const id = message.id as JsonRpcId;
  const params = asParams(message.params);

  try {
    switch (message.method) {
      case 'initialize':
        return rpcResult(id, {
          protocolVersion: negotiateProtocolVersion(params.protocolVersion),
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: MCP_SERVER_INFO,
          instructions:
            'Use get_insights for live game analytics, list_patch_notes / publish_patch_note for published notes (never set is_popup), and list_monster_types / get_monster_type / create_monster_type / update_monster_type / create_monster_subtype / update_monster_subtype to manage the game CMS monster catalog. Do not invent a local bestiary.',
        });
      case 'ping':
        return rpcResult(id, {});
      case 'tools/list':
        return rpcResult(id, { tools: MCP_TOOLS });
      case 'tools/call': {
        const name = params.name;
        if (typeof name !== 'string' || !name) {
          return rpcError(id, JSONRPC_INVALID_PARAMS, 'Tool Name Is Required.');
        }
        try {
          const output = await executeMcpTool(name, params.arguments, runtime);
          return rpcResult(id, toolTextResult(output, false));
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          if (detail.startsWith('Unknown Tool:')) {
            return rpcError(id, JSONRPC_INVALID_PARAMS, detail);
          }
          return rpcResult(id, toolTextResult({ error: detail }, true));
        }
      }
      default:
        return rpcError(id, JSONRPC_METHOD_NOT_FOUND, `Method Not Found: ${message.method}`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return rpcError(id, JSONRPC_INTERNAL, detail);
  }
}

export async function dispatchMcpMessage(
  body: unknown,
  runtime: McpToolRuntime = {}
): Promise<McpDispatchResult> {
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return {
        kind: 'response',
        response: rpcError(null, JSONRPC_INVALID_REQUEST, 'Invalid JSON-RPC Batch.'),
      };
    }
    const responses: JsonRpcResponse[] = [];
    for (const item of body) {
      const response = await handleSingle(item as JsonRpcRequest, runtime);
      if (response) responses.push(response);
    }
    if (responses.length === 0) return { kind: 'empty' };
    return { kind: 'batch', responses };
  }

  if (!isObject(body)) {
    return {
      kind: 'response',
      response: rpcError(null, JSONRPC_PARSE, 'Parse Error.'),
    };
  }

  const response = await handleSingle(body as JsonRpcRequest, runtime);
  if (!response) return { kind: 'empty' };
  return { kind: 'response', response };
}

export type RpgGet = <T>(path: string) => Promise<T>;

type ViewDataResponse<T> = { resource: string; data: T };

interface MessagesPerUserRow {
  date: string;
  activeUsers: number;
  totalMessages: number;
  msgsPerUser: number;
}

interface SessionLengthApiResponse {
  daily: {
    date: string;
    totalSessions: number;
    avgDurationMin: number;
    medianDurationMin: number;
    p95DurationMin: number;
  }[];
  distribution: { range: string; count: number; percentage: number }[];
}

interface FeatureUsageApiResponse {
  usage: {
    feature: string;
    totalUses: number;
    percentage: number;
    uniqueUsers: number;
    avgDurationMs: number;
  }[];
  chatOnlyUsers: number;
}

interface AnalyticsOverviewResponse {
  dailyUsage: any[];
  modelUsage: any[];
  topConsumers: any[];
  featureCostUsage: any[];
  sessionMetrics: any[];
  activeSessions: { current: number; prior: number };
  hourlyStats: any[];
  pageVisits: any[];
  costAnalytics: {
    daily: any[];
    byModel: any[];
    byRole: any[];
    failoverRate: number;
    failoverCalls: number;
    totalCalls: number;
  };
  featureUsage: {
    usage: {
      feature: string;
      totalUses: number;
      percentage: number;
      uniqueUsers: number;
      avgDurationMs: number;
    }[];
    chatOnlyUsers: number;
  };
  sessionLengths: {
    daily: any[];
    distribution: any[];
  };
  messagesPerUser: MessagesPerUserRow[];
}

export interface AnalyticsInsightsSnapshot {
  generatedAt: string;
  usageTrends: {
    date: string;
    tokens: number;
    cost: number;
    users: number;
  }[];
  totalCost: number;
  modelDistribution: { name: string; value: number; color: string }[];
  topUsers: { email: string; tokens: string; cost: number; usages: number }[];
  activeSessionsCount: number;
  avgSessionLength: number;
  sessionTrends: {
    date: string;
    totalSessions: number;
    avgDurationMin: number;
    medianDurationMin: number;
    p95DurationMin: number;
  }[];
  featureUsage: {
    usage: {
      feature: string;
      totalUses: number;
      percentage: number;
      totalCost: number;
      uniqueUsers: number;
      avgDurationMs: number;
    }[];
    chatOnlyUsers: number;
  };
  messagesPerUser: MessagesPerUserRow[];
  sessionLengths: {
    daily: {
      date: string;
      totalSessions: number;
      avgDurationMin: number;
      medianDurationMin: number;
      p95DurationMin: number;
    }[];
    distribution: { range: string; count: number; percentage: number }[];
  };
  realTimeTrends: { hour: string; users: number; cost: number; latency: number }[];
  costComparison: number | null;
  sessionsComparison: number | null;
  latencyComparison: number | null;
  avgLatency: number;
  pageVisitUsage: { page: string; visits: number; percentage: number; uniqueUsers: number }[];
  modelCostData: {
    model: string;
    calls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    avgLatencyMs: number;
  }[];
  dailyCostData: {
    date: string;
    activeUsers: number;
    totalCost: number;
    costPerUser: number;
  }[];
  degradedMessage: string | null;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function titleCaseFeature(name: string): string {
  if (!name) return 'Unknown';
  return name
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function withGeneratedAt(
  snapshot: Omit<AnalyticsInsightsSnapshot, 'generatedAt'>
): AnalyticsInsightsSnapshot {
  return { generatedAt: new Date().toISOString(), ...snapshot };
}

export function formatAnalyticsOverview(
  overview: AnalyticsOverviewResponse
): AnalyticsInsightsSnapshot {
  const dailyMetrics = overview.dailyUsage || [];
  const modelData = overview.modelUsage || [];
  const costAnalytics = overview.costAnalytics;

  let modelCostData = modelData.map((m) => ({
    model: m.model || 'Unknown',
    calls: Number(m.usage_count) || 0,
    totalInputTokens: Number(m.total_input_tokens) || 0,
    totalOutputTokens: Number(m.total_output_tokens) || 0,
    totalCost: Number(m.total_cost) || 0,
    avgLatencyMs: Number(m.avg_latency) || 0,
  }));

  let dailyCostData = dailyMetrics.map((m) => ({
    date: m.date,
    activeUsers: m.active_users || 0,
    totalCost: Number(m.total_cost) || 0,
    costPerUser: m.active_users > 0 ? m.total_cost / m.active_users : 0,
  }));

  if (costAnalytics?.byModel?.length) {
    modelCostData = costAnalytics.byModel.map((m) => ({
      model: m.model || 'Unknown',
      calls: Number(m.calls) || 0,
      totalInputTokens: Number(m.totalInputTokens) || 0,
      totalOutputTokens: Number(m.totalOutputTokens) || 0,
      totalCost: Number(m.totalCost) || 0,
      avgLatencyMs: Number(m.avgLatencyMs) || 0,
    }));
  }

  if (costAnalytics?.daily?.length) {
    dailyCostData = costAnalytics.daily.map((d) => ({
      date: typeof d.date === 'string' ? d.date : String(d.date),
      activeUsers: Number(d.activeUsers) || 0,
      totalCost: Number(d.totalCost) || 0,
      costPerUser: Number(d.costPerUser) || 0,
    }));
  }

  const usageTrends = dailyMetrics
    .map((m) => ({
      date: new Date(m.date).toISOString().split('T')[0],
      tokens: m.total_tokens || 0,
      cost: m.total_cost || 0,
      users: m.active_users || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalCost = dailyMetrics.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);

  const sortedDailyCosts = [...dailyMetrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestDay = sortedDailyCosts[sortedDailyCosts.length - 1];
  const priorDay = sortedDailyCosts[sortedDailyCosts.length - 2];
  const costComparison = percentChange(
    Number(latestDay?.total_cost || 0),
    Number(priorDay?.total_cost || 0)
  );

  const totalModelUses = modelData.reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const colors = ['#3ecf8e', '#20cce0', '#38bdf8', '#fbbf24', '#f87171'];
  const distribution = modelData.map((m, idx) => ({
    name: m.model || 'Unknown',
    value: Math.round((m.usage_count / totalModelUses) * 100),
    color: colors[idx % colors.length],
  }));

  const topConsumersData = overview.topConsumers || [];
  const leaders = topConsumersData.map((entry) => {
    const email = entry.email || `User ${String(entry.userId).slice(0, 5)}`;
    const tokens = entry.total_tokens || 0;
    return {
      email,
      tokens: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${Math.round(tokens / 1000)}k`,
      cost: entry.total_cost || 0,
      usages: entry.interaction_count || 0,
    };
  });

  const featureData = overview.featureCostUsage || [];
  const totalUsesAll = featureData.reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const costByFeature = new Map<string, number>();
  featureData.forEach((f) => {
    const key = String(f.feature_name || '').toLowerCase();
    if (key) costByFeature.set(key, Number(f.total_cost) || 0);
  });

  let featureUsageRows = featureData
    .map((f) => ({
      feature: titleCaseFeature(String(f.feature_name || 'Unknown')),
      totalUses: Number(f.usage_count) || 0,
      percentage: parseFloat(((f.usage_count / totalUsesAll) * 100).toFixed(1)),
      totalCost: Number(f.total_cost) || 0,
      uniqueUsers: 0,
      avgDurationMs: 0,
    }))
    .sort((a, b) => b.totalUses - a.totalUses);

  let chatOnlyUsers = 0;
  if (overview.featureUsage?.usage?.length) {
    featureUsageRows = overview.featureUsage.usage
      .map((f) => {
        const feature = titleCaseFeature(String(f.feature || 'Unknown'));
        return {
          feature,
          totalUses: Number(f.totalUses) || 0,
          percentage: Number(f.percentage) || 0,
          totalCost: costByFeature.get(String(f.feature || '').toLowerCase()) || 0,
          uniqueUsers: Number(f.uniqueUsers) || 0,
          avgDurationMs: Number(f.avgDurationMs) || 0,
        };
      })
      .sort((a, b) => b.totalUses - a.totalUses);
    chatOnlyUsers = Number(overview.featureUsage.chatOnlyUsers) || 0;
  }

  let sessionDaily = (overview.sessionMetrics || [])
    .map((s) => ({
      date: new Date(s.date).toISOString().split('T')[0],
      totalSessions: s.total_sessions,
      avgDurationMin: parseFloat(((s.avg_duration_sec || 0) / 60).toFixed(1)),
      medianDurationMin: parseFloat(((s.median_duration_sec || 0) / 60).toFixed(1)),
      p95DurationMin: parseFloat(((s.p95_duration_sec || 0) / 60).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let sessionDistribution: { range: string; count: number; percentage: number }[] = [];
  if (overview.sessionLengths?.daily?.length) {
    sessionDaily = overview.sessionLengths.daily
      .map((d: any) => ({
        date: d.date,
        totalSessions: d.totalSessions,
        avgDurationMin: d.avgDurationMin,
        medianDurationMin: d.medianDurationMin,
        p95DurationMin: d.p95DurationMin,
      }))
      .sort((a: any, b: any) => a.date.localeCompare(b.date));
  }
  sessionDistribution = overview.sessionLengths?.distribution || [];

  const messagesPerUser = (overview.messagesPerUser || [])
    .map((row) => ({
      date: row.date,
      activeUsers: Number(row.activeUsers) || 0,
      totalMessages: Number(row.totalMessages) || 0,
      msgsPerUser: Number(row.msgsPerUser) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeSessionsCount = overview.activeSessions?.current || 0;
  const priorActiveSessionsCount = overview.activeSessions?.prior || 0;
  const sessionsComparison = percentChange(activeSessionsCount, priorActiveSessionsCount);

  const sortedHourly = [...(overview.hourlyStats || [])].sort(
    (a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime()
  );
  const recentHours = sortedHourly.slice(-12);
  const priorHours = sortedHourly.slice(-24, -12);

  const realTimeTrends = sortedHourly.map((h) => {
    const date = new Date(h.hour);
    return {
      hour: Number.isNaN(date.getTime())
        ? String(h.hour)
        : date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
          }),
      users: h.active_users || 0,
      cost: h.total_cost || 0,
      latency: h.avg_latency || 0,
    };
  });

  const avgOf = (rows: typeof sortedHourly, key: 'avg_latency') => {
    if (rows.length === 0) return 0;
    return rows.reduce((acc, h) => acc + (Number(h[key]) || 0), 0) / rows.length;
  };
  const latencyComparison = percentChange(avgOf(recentHours, 'avg_latency'), avgOf(priorHours, 'avg_latency'));

  const avgLatency =
    realTimeTrends.length > 0
      ? Math.round(realTimeTrends.reduce((acc, curr) => acc + curr.latency, 0) / realTimeTrends.length)
      : 0;

  const pageVisitData = overview.pageVisits || [];
  const totalPageVisits = pageVisitData.reduce((acc, curr) => acc + (curr.visit_count || 0), 0) || 1;
  const pageVisitUsage = pageVisitData
    .map((p) => ({
      page: p.page,
      visits: p.visit_count || 0,
      percentage: parseFloat(((p.visit_count / totalPageVisits) * 100).toFixed(1)),
      uniqueUsers: p.unique_users || 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  return withGeneratedAt({
    usageTrends,
    totalCost,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount,
    avgSessionLength:
      sessionDaily.length > 0 ? Math.round(sessionDaily[sessionDaily.length - 1].avgDurationMin) : 0,
    sessionTrends: sessionDaily,
    featureUsage: { usage: featureUsageRows, chatOnlyUsers },
    messagesPerUser,
    sessionLengths: { daily: sessionDaily, distribution: sessionDistribution },
    realTimeTrends,
    costComparison,
    sessionsComparison,
    latencyComparison,
    avgLatency,
    pageVisitUsage,
    modelCostData,
    dailyCostData,
    degradedMessage: null,
  });
}

async function fetchCostAnalyticsBundle(rpgGet: RpgGet, days = 30) {
  const failures: string[] = [];
  const recover = <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> =>
    request.catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn(`[AnalyticsInsights] ${label} failed:`, error);
      failures.push(`${label}: ${detail}`);
      return fallback;
    });

  const [dailyMetrics, modelRes, costAnalytics] = await Promise.all([
    recover(
      'Daily Usage',
      rpgGet<ViewDataResponse<any[]>>(`/api/admin/analytics/view-data?resource=daily-usage&days=${days}`).then(
        (result) => result.data || []
      ),
      []
    ),
    recover(
      'Model Usage',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=model-usage'),
      { resource: 'model-usage', data: [] }
    ),
    recover(
      'Cost Analytics',
      rpgGet<{
        daily?: AnalyticsOverviewResponse['costAnalytics']['daily'];
        byModel?: AnalyticsOverviewResponse['costAnalytics']['byModel'];
        byRole?: AnalyticsOverviewResponse['costAnalytics']['byRole'];
        failoverRate?: number;
      }>(`/api/admin/analytics/cost-analytics?days=${days}`),
      null
    ),
  ]);

  const modelData = modelRes.data || [];

  let modelCostData = modelData.map((m) => ({
    model: m.model || 'Unknown',
    calls: Number(m.usage_count) || 0,
    totalInputTokens: Number(m.total_input_tokens) || 0,
    totalOutputTokens: Number(m.total_output_tokens) || 0,
    totalCost: Number(m.total_cost) || 0,
    avgLatencyMs: Number(m.avg_latency) || 0,
  }));

  let dailyCostData = dailyMetrics.map((m) => ({
    date: m.date,
    activeUsers: m.active_users || 0,
    totalCost: Number(m.total_cost) || 0,
    costPerUser: m.active_users > 0 ? m.total_cost / m.active_users : 0,
  }));

  if (costAnalytics?.byModel?.length) {
    modelCostData = costAnalytics.byModel.map((m) => ({
      model: m.model || 'Unknown',
      calls: Number(m.calls) || 0,
      totalInputTokens: Number(m.totalInputTokens) || 0,
      totalOutputTokens: Number(m.totalOutputTokens) || 0,
      totalCost: Number(m.totalCost) || 0,
      avgLatencyMs: Number(m.avgLatencyMs) || 0,
    }));
  }
  if (costAnalytics?.daily?.length) {
    dailyCostData = costAnalytics.daily.map((d) => ({
      date: typeof d.date === 'string' ? d.date : String(d.date),
      activeUsers: Number(d.activeUsers) || 0,
      totalCost: Number(d.totalCost) || 0,
      costPerUser: Number(d.costPerUser) || 0,
    }));
  }

  return {
    modelCostData,
    dailyCostData,
    dailyMetrics,
    modelData,
    degradedMessage:
      failures.length > 0
        ? `Some Cost Analytics Could Not Be Loaded. ${failures.join(' | ')}`
        : null,
  };
}

async function fetchAnalyticsInsightsFallback(rpgGet: RpgGet): Promise<AnalyticsInsightsSnapshot> {
  const degradedSources: string[] = [];
  const optional = <T,>(label: string, request: Promise<T>, fallback: T): Promise<T> =>
    request.catch((error) => {
      const detail = error instanceof Error ? error.message : String(error);
      console.warn(`[AnalyticsInsights] ${label} failed:`, error);
      degradedSources.push(`${label}: ${detail}`);
      return fallback;
    });

  const [
    costBundle,
    topConsumersRes,
    featureRes,
    sessionStatsRes,
    activeSessionsRes,
    hourlyStatsRes,
    pageVisitRes,
    featureApi,
    sessionLengthData,
    messagesData,
  ] = await Promise.all([
    optional('Cost Analytics', fetchCostAnalyticsBundle(rpgGet, 30), {
      dailyMetrics: [],
      modelData: [],
      modelCostData: [],
      dailyCostData: [],
      degradedMessage: null,
    }),
    optional(
      'Top Consumers',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=top-consumers&limit=5'),
      { resource: 'top-consumers', data: [] }
    ),
    optional(
      'Feature Cost Data',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=feature-usage'),
      { resource: 'feature-usage', data: [] }
    ),
    optional(
      'Session Metrics',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=session-metrics&days=30'),
      { resource: 'session-metrics', data: [] }
    ),
    optional(
      'Active Sessions',
      rpgGet<ViewDataResponse<{ current: number; prior: number }>>(
        '/api/admin/analytics/view-data?resource=active-sessions'
      ),
      { resource: 'active-sessions', data: { current: 0, prior: 0 } }
    ),
    optional(
      'Hourly Statistics',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=hourly-stats'),
      { resource: 'hourly-stats', data: [] }
    ),
    optional(
      'Page Visits',
      rpgGet<ViewDataResponse<any[]>>('/api/admin/analytics/view-data?resource=page-visits'),
      { resource: 'page-visits', data: [] }
    ),
    optional(
      'Feature Usage',
      rpgGet<FeatureUsageApiResponse>('/api/admin/analytics/feature-usage'),
      null
    ),
    optional(
      'Session Lengths',
      rpgGet<SessionLengthApiResponse>('/api/admin/analytics/session-length?days=30'),
      null
    ),
    optional(
      'Messages Per User',
      rpgGet<MessagesPerUserRow[]>('/api/admin/analytics/messages-per-user?days=7'),
      null
    ),
  ]);

  const { dailyMetrics, modelData, modelCostData, dailyCostData } = costBundle;
  if (costBundle.degradedMessage) {
    degradedSources.push(costBundle.degradedMessage);
  }

  const usageTrends = dailyMetrics
    .map((m) => ({
      date: new Date(m.date).toISOString().split('T')[0],
      tokens: m.total_tokens || 0,
      cost: m.total_cost || 0,
      users: m.active_users || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalCost = dailyMetrics.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);

  const sortedDailyCosts = [...dailyMetrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestDay = sortedDailyCosts[sortedDailyCosts.length - 1];
  const priorDay = sortedDailyCosts[sortedDailyCosts.length - 2];
  const costComparison = percentChange(
    Number(latestDay?.total_cost || 0),
    Number(priorDay?.total_cost || 0)
  );

  const totalModelUses = modelData.reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const colors = ['#3ecf8e', '#20cce0', '#38bdf8', '#fbbf24', '#f87171'];
  const distribution = modelData.map((m, idx) => ({
    name: m.model || 'Unknown',
    value: Math.round((m.usage_count / totalModelUses) * 100),
    color: colors[idx % colors.length],
  }));

  const topConsumersData = topConsumersRes.data || [];
  const leaders = topConsumersData.map((entry) => {
    const email = entry.email || `User ${String(entry.userId).slice(0, 5)}`;
    const tokens = entry.total_tokens || 0;
    return {
      email,
      tokens: tokens > 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : `${Math.round(tokens / 1000)}k`,
      cost: entry.total_cost || 0,
      usages: entry.interaction_count || 0,
    };
  });

  const featureData = featureRes.data || [];
  const totalUsesAll = featureData.reduce((acc, curr) => acc + (curr.usage_count || 0), 0) || 1;
  const costByFeature = new Map<string, number>();
  featureData.forEach((f) => {
    const key = String(f.feature_name || '').toLowerCase();
    if (key) costByFeature.set(key, Number(f.total_cost) || 0);
  });

  let featureUsageRows = featureData
    .map((f) => ({
      feature: titleCaseFeature(String(f.feature_name || 'Unknown')),
      totalUses: Number(f.usage_count) || 0,
      percentage: parseFloat(((f.usage_count / totalUsesAll) * 100).toFixed(1)),
      totalCost: Number(f.total_cost) || 0,
      uniqueUsers: 0,
      avgDurationMs: 0,
    }))
    .sort((a, b) => b.totalUses - a.totalUses);

  let chatOnlyUsers = 0;
  if (featureApi?.usage?.length) {
    featureUsageRows = featureApi.usage
      .map((f) => {
        const feature = titleCaseFeature(String(f.feature || 'Unknown'));
        return {
          feature,
          totalUses: Number(f.totalUses) || 0,
          percentage: Number(f.percentage) || 0,
          totalCost: costByFeature.get(String(f.feature || '').toLowerCase()) || 0,
          uniqueUsers: Number(f.uniqueUsers) || 0,
          avgDurationMs: Number(f.avgDurationMs) || 0,
        };
      })
      .sort((a, b) => b.totalUses - a.totalUses);
    chatOnlyUsers = Number(featureApi.chatOnlyUsers) || 0;
  }

  let sessionDaily = (sessionStatsRes.data || [])
    .map((s) => ({
      date: new Date(s.date).toISOString().split('T')[0],
      totalSessions: s.total_sessions,
      avgDurationMin: parseFloat(((s.avg_duration_sec || 0) / 60).toFixed(1)),
      medianDurationMin: parseFloat(((s.median_duration_sec || 0) / 60).toFixed(1)),
      p95DurationMin: parseFloat(((s.p95_duration_sec || 0) / 60).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  let sessionDistribution: { range: string; count: number; percentage: number }[] = [];
  if (sessionLengthData?.daily?.length) {
    sessionDaily = sessionLengthData.daily
      .map((d) => ({
        date: d.date,
        totalSessions: d.totalSessions,
        avgDurationMin: d.avgDurationMin,
        medianDurationMin: d.medianDurationMin,
        p95DurationMin: d.p95DurationMin,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  sessionDistribution = sessionLengthData?.distribution || [];

  const messagesPerUser = (messagesData || [])
    .map((row) => ({
      date: row.date,
      activeUsers: Number(row.activeUsers) || 0,
      totalMessages: Number(row.totalMessages) || 0,
      msgsPerUser: Number(row.msgsPerUser) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activeSessionsCount = activeSessionsRes.data?.current || 0;
  const priorActiveSessionsCount = activeSessionsRes.data?.prior || 0;
  const sessionsComparison = percentChange(activeSessionsCount, priorActiveSessionsCount);

  const sortedHourly = [...(hourlyStatsRes.data || [])].sort(
    (a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime()
  );
  const recentHours = sortedHourly.slice(-12);
  const priorHours = sortedHourly.slice(-24, -12);

  const realTimeTrends = sortedHourly.map((h) => {
    const date = new Date(h.hour);
    return {
      hour: Number.isNaN(date.getTime())
        ? String(h.hour)
        : date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
          }),
      users: h.active_users || 0,
      cost: h.total_cost || 0,
      latency: h.avg_latency || 0,
    };
  });

  const avgOf = (rows: typeof sortedHourly, key: 'avg_latency') => {
    if (rows.length === 0) return 0;
    return rows.reduce((acc, h) => acc + (Number(h[key]) || 0), 0) / rows.length;
  };
  const latencyComparison = percentChange(avgOf(recentHours, 'avg_latency'), avgOf(priorHours, 'avg_latency'));

  const avgLatency =
    realTimeTrends.length > 0
      ? Math.round(realTimeTrends.reduce((acc, curr) => acc + curr.latency, 0) / realTimeTrends.length)
      : 0;

  const pageVisitData = pageVisitRes.data || [];
  const totalPageVisits = pageVisitData.reduce((acc, curr) => acc + (curr.visit_count || 0), 0) || 1;
  const pageVisitUsage = pageVisitData
    .map((p) => ({
      page: p.page,
      visits: p.visit_count || 0,
      percentage: parseFloat(((p.visit_count / totalPageVisits) * 100).toFixed(1)),
      uniqueUsers: p.unique_users || 0,
    }))
    .sort((a, b) => b.visits - a.visits);

  return withGeneratedAt({
    usageTrends,
    totalCost,
    modelDistribution: distribution,
    topUsers: leaders,
    activeSessionsCount,
    avgSessionLength:
      sessionDaily.length > 0 ? Math.round(sessionDaily[sessionDaily.length - 1].avgDurationMin) : 0,
    sessionTrends: sessionDaily,
    featureUsage: { usage: featureUsageRows, chatOnlyUsers },
    messagesPerUser,
    sessionLengths: { daily: sessionDaily, distribution: sessionDistribution },
    realTimeTrends,
    costComparison,
    sessionsComparison,
    latencyComparison,
    avgLatency,
    pageVisitUsage,
    modelCostData,
    dailyCostData,
    degradedMessage:
      degradedSources.length > 0
        ? `Some Analytics Could Not Be Loaded. ${degradedSources.join(' | ')}`
        : null,
  });
}

export async function fetchAnalyticsInsights(rpgGet: RpgGet): Promise<AnalyticsInsightsSnapshot> {
  try {
    const overview = await rpgGet<AnalyticsOverviewResponse>('/api/admin/analytics/overview');
    if (overview && overview.dailyUsage && overview.costAnalytics) {
      return formatAnalyticsOverview(overview);
    }
  } catch (error) {
    console.warn(
      '[AnalyticsInsights] Consolidated overview fetch failed, falling back to parallel fetches:',
      error
    );
  }

  return fetchAnalyticsInsightsFallback(rpgGet);
}
