import { fetchAnalyticsInsights } from '../../src/lib/analyticsInsights';
import {
  buildPatchNotePayload,
  normalizePatchNotesList,
  sortPatchNotesNewestFirst,
  type PatchNotePayload,
  type PublishPatchNoteInput,
} from './mcpPatchNotes';
import { fetchRpgAdminServer, fetchRpgPublic } from './rpgServerApi';

export const MCP_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'] as const;
export const DEFAULT_MCP_PROTOCOL_VERSION = '2025-03-26';

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
];

export type McpToolRuntime = {
  getInsights?: () => Promise<unknown>;
  publishPatchNote?: (payload: PatchNotePayload) => Promise<unknown>;
  listPatchNotes?: () => Promise<unknown>;
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function executeMcpTool(
  name: string,
  args: unknown,
  runtime: McpToolRuntime = {}
): Promise<unknown> {
  const getInsights = runtime.getInsights || defaultGetInsights;
  const publishPatchNote = runtime.publishPatchNote || defaultPublishPatchNote;
  const listPatchNotes = runtime.listPatchNotes || defaultListPatchNotes;

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

  throw new Error(`Unknown Tool: ${name}`);
}

export function negotiateProtocolVersion(requested: unknown): string {
  if (typeof requested === 'string' && MCP_PROTOCOL_VERSIONS.includes(requested as (typeof MCP_PROTOCOL_VERSIONS)[number])) {
    return requested;
  }
  return DEFAULT_MCP_PROTOCOL_VERSION;
}
