import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler, {
  buildMonsterSubtypeCreatePayload,
  buildMonsterSubtypeUpdatePayload,
  buildMonsterTypeCreatePayload,
  buildMonsterTypeUpdatePayload,
  buildPatchNotePayload,
  dispatchMcpMessage,
  executeMcpTool,
  extractBearerToken,
  formatAnalyticsOverview,
  isAuthorizedMcpRequest,
  MCP_TOOLS,
  normalizeMonsterTypesList,
  sortPatchNotesNewestFirst,
} from '../api/mcp';

const EXPECTED_TOOL_NAMES = [
  'get_insights',
  'publish_patch_note',
  'list_patch_notes',
  'list_monster_types',
  'get_monster_type',
  'create_monster_type',
  'update_monster_type',
  'create_monster_subtype',
  'update_monster_subtype',
];

const KEY = 'test-mcp-key-please-ignore';

afterEach(() => {
  delete process.env.MCP_API_KEY;
});

function mockRequest(overrides: Partial<VercelRequest> & { body?: unknown } = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {},
    query: {},
    body: undefined,
    ...overrides,
  } as VercelRequest;
}

function mockResponse() {
  const state = {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    ended: false,
  };

  const response = {
    setHeader(key: string, value: string) {
      state.headers[key] = value;
      return response;
    },
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      state.body = payload;
      state.ended = true;
      return response;
    },
    end(payload?: unknown) {
      if (payload !== undefined) state.body = payload;
      state.ended = true;
      return response;
    },
    write() {
      return true;
    },
  };

  return { response: response as unknown as VercelResponse, state };
}

describe('MCP bearer auth', () => {
  it('extracts a Bearer token', () => {
    assert.equal(extractBearerToken('Bearer abc123'), 'abc123');
    assert.equal(extractBearerToken('bearer abc123'), 'abc123');
    assert.equal(extractBearerToken('Basic abc123'), null);
    assert.equal(extractBearerToken(undefined), null);
  });

  it('rejects missing, blank, and wrong keys', () => {
    assert.equal(isAuthorizedMcpRequest(undefined, KEY), false);
    assert.equal(isAuthorizedMcpRequest('Bearer', KEY), false);
    assert.equal(isAuthorizedMcpRequest('Bearer wrong', KEY), false);
    assert.equal(isAuthorizedMcpRequest(`Bearer ${KEY}`, undefined), false);
    assert.equal(isAuthorizedMcpRequest(`Bearer ${KEY}`, ''), false);
  });

  it('accepts the configured Bearer key', () => {
    assert.equal(isAuthorizedMcpRequest(`Bearer ${KEY}`, KEY), true);
  });

  it('returns HTTP 401 when the handler is missing or has the wrong key', async () => {
    process.env.MCP_API_KEY = KEY;

    const missing = mockResponse();
    await handler(mockRequest({ headers: {} }), missing.response);
    assert.equal(missing.state.statusCode, 401);
    assert.deepEqual(missing.state.body, { error: 'Unauthorized.' });

    const wrong = mockResponse();
    await handler(
      mockRequest({ headers: { authorization: 'Bearer nope' } }),
      wrong.response
    );
    assert.equal(wrong.state.statusCode, 401);
  });

  it('returns HTTP 500 when MCP_API_KEY is not configured', async () => {
    const res = mockResponse();
    await handler(
      mockRequest({
        headers: { authorization: `Bearer ${KEY}` },
        body: { jsonrpc: '2.0', id: 1, method: 'ping' },
      }),
      res.response
    );
    assert.equal(res.state.statusCode, 500);
    assert.deepEqual(res.state.body, { error: 'MCP Server Is Not Configured.' });
  });
});

describe('publish_patch_note payload', () => {
  it('matches createNews fields with published patch-note flags and is_popup false', () => {
    const payload = buildPatchNotePayload({
      title: '  Early Access v0.62  ',
      content: '<p>Fixes</p>',
      version: ' v0.62 ',
    });

    assert.deepEqual(payload, {
      title: 'Early Access v0.62',
      content: '<p>Fixes</p>',
      imageUrl: null,
      published: true,
      is_popup: false,
      active: false,
      highlights: [],
      cta_label: null,
      cta_url: null,
      version: 'v0.62',
      is_patch_note: true,
    });
    assert.equal(payload.is_popup, false);
    assert.equal(payload.is_patch_note, true);
    assert.equal(payload.published, true);
  });

  it('rejects a blank title', () => {
    assert.throws(
      () => buildPatchNotePayload({ title: '  ', content: 'body' }),
      /Title Is Required/
    );
  });
});

describe('list_patch_notes ordering', () => {
  it('sorts newest createdAt first', () => {
    const sorted = sortPatchNotesNewestFirst([
      { id: 'old', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'new', createdAt: '2026-09-01T00:00:00.000Z' },
      { id: 'mid', createdAt: '2026-06-01T00:00:00.000Z' },
    ]);
    assert.deepEqual(
      sorted.map((item) => item.id),
      ['new', 'mid', 'old']
    );
  });
});

describe('MCP JSON-RPC tools', () => {
  it('lists insights, patch-note, and monster catalog tools', async () => {
    assert.deepEqual(
      MCP_TOOLS.map((tool) => tool.name),
      EXPECTED_TOOL_NAMES
    );

    const result = await dispatchMcpMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });
    assert.equal(result.kind, 'response');
    if (result.kind !== 'response') return;
    const tools = (result.response.result as { tools: { name: string }[] }).tools;
    assert.deepEqual(
      tools.map((tool) => tool.name),
      EXPECTED_TOOL_NAMES
    );
  });

  it('handles initialize and ping', async () => {
    const init = await dispatchMcpMessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test' } },
    });
    assert.equal(init.kind, 'response');
    if (init.kind === 'response') {
      const info = init.response.result as { protocolVersion: string; serverInfo: { name: string } };
      assert.equal(info.protocolVersion, '2025-03-26');
      assert.equal(info.serverInfo.name, 'heroic-dashboard');
    }

    const ping = await dispatchMcpMessage({ jsonrpc: '2.0', id: 2, method: 'ping' });
    assert.equal(ping.kind, 'response');
  });

  it('returns 202-style empty dispatch for initialized notifications', async () => {
    const result = await dispatchMcpMessage({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });
    assert.equal(result.kind, 'empty');
  });

  it('calls publish_patch_note with the CMS payload and omits popup true', async () => {
    let posted: unknown;
    const output = await executeMcpTool(
      'publish_patch_note',
      { title: 'v0.62', content: 'notes', version: 'v0.62' },
      {
        publishPatchNote: async (payload) => {
          posted = payload;
          return { id: 'news-1' };
        },
      }
    );

    const record = posted as { is_popup: boolean; is_patch_note: boolean; published: boolean };
    assert.equal(record.is_popup, false);
    assert.equal(record.is_patch_note, true);
    assert.equal(record.published, true);
    assert.deepEqual((output as { result: { id: string } }).result, { id: 'news-1' });
  });

  it('returns get_insights through tools/call as MCP text content', async () => {
    const snapshot = {
      activeSessionsCount: 4,
      totalCost: 12.5,
      featureUsage: { usage: [{ feature: 'Chat', totalUses: 9 }], chatOnlyUsers: 1 },
      modelCostData: [{ model: 'gpt', totalCost: 12.5 }],
    };
    const result = await dispatchMcpMessage(
      {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'get_insights', arguments: {} },
      },
      { getInsights: async () => snapshot }
    );
    assert.equal(result.kind, 'response');
    if (result.kind !== 'response') return;
    const payload = result.response.result as {
      isError: boolean;
      content: { type: string; text: string }[];
    };
    assert.equal(payload.isError, false);
    const parsed = JSON.parse(payload.content[0].text);
    assert.equal(parsed.activeSessionsCount, 4);
    assert.equal(parsed.totalCost, 12.5);
    assert.equal(parsed.featureUsage.usage[0].feature, 'Chat');
  });
});

describe('get_insights snapshot shape', () => {
  it('exposes active users, sessions, feature usage, and cost from overview', () => {
    const snapshot = formatAnalyticsOverview({
      dailyUsage: [
        { date: '2026-08-31', total_tokens: 100, total_cost: 2, active_users: 3 },
        { date: '2026-09-01', total_tokens: 200, total_cost: 4, active_users: 5 },
      ],
      modelUsage: [{ model: 'gpt-test', usage_count: 10, total_cost: 4 }],
      topConsumers: [],
      featureCostUsage: [{ feature_name: 'chat', usage_count: 8, total_cost: 1.5 }],
      sessionMetrics: [],
      activeSessions: { current: 7, prior: 5 },
      hourlyStats: [],
      pageVisits: [],
      costAnalytics: {
        daily: [{ date: '2026-09-01', activeUsers: 5, totalCost: 4, costPerUser: 0.8 }],
        byModel: [
          {
            model: 'gpt-test',
            calls: 10,
            totalInputTokens: 1,
            totalOutputTokens: 2,
            totalCost: 4,
            avgLatencyMs: 100,
          },
        ],
        byRole: [],
        failoverRate: 0,
        failoverCalls: 0,
        totalCalls: 10,
      },
      featureUsage: {
        usage: [
          { feature: 'chat', totalUses: 8, percentage: 100, uniqueUsers: 3, avgDurationMs: 50 },
        ],
        chatOnlyUsers: 2,
      },
      sessionLengths: {
        daily: [
          {
            date: '2026-09-01',
            totalSessions: 9,
            avgDurationMin: 12,
            medianDurationMin: 10,
            p95DurationMin: 20,
          },
        ],
        distribution: [],
      },
      messagesPerUser: [],
    } as Parameters<typeof formatAnalyticsOverview>[0]);

    assert.equal(snapshot.activeSessionsCount, 7);
    assert.equal(snapshot.totalCost, 6);
    assert.equal(snapshot.usageTrends.at(-1)?.users, 5);
    assert.equal(snapshot.featureUsage.usage[0].feature, 'Chat');
    assert.equal(snapshot.featureUsage.chatOnlyUsers, 2);
    assert.equal(snapshot.modelCostData[0].totalCost, 4);
    assert.equal(snapshot.avgSessionLength, 12);
    assert.equal(typeof snapshot.generatedAt, 'string');
  });
});

describe('MCP HTTP handler JSON-RPC', () => {
  it('answers OPTIONS without requiring a key', async () => {
    const res = mockResponse();
    await handler(mockRequest({ method: 'OPTIONS', headers: {} }), res.response);
    assert.equal(res.state.statusCode, 204);
  });

  it('returns tools/list after a valid Bearer token', async () => {
    process.env.MCP_API_KEY = KEY;
    const res = mockResponse();
    await handler(
      mockRequest({
        headers: { authorization: `Bearer ${KEY}`, accept: 'application/json' },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      }),
      res.response
    );
    assert.equal(res.state.statusCode, 200);
    const body = res.state.body as { result: { tools: { name: string }[] } };
    assert.deepEqual(
      body.result.tools.map((tool) => tool.name),
      EXPECTED_TOOL_NAMES
    );
  });
});

describe('Vercel function layout', () => {
  it('only ships clerk-proxy and mcp under api/, with no local runtime imports', () => {
    const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'api');
    const files = readdirSync(apiRoot).sort();
    assert.deepEqual(files, ['clerk-proxy.ts', 'mcp.ts']);

    const mcpSource = readFileSync(join(apiRoot, 'mcp.ts'), 'utf8');
    assert.equal(mcpSource.includes("from 'node:crypto'"), false);
    assert.equal(mcpSource.includes('from "node:crypto"'), false);
    assert.equal(mcpSource.includes("from './"), false);
    assert.equal(mcpSource.includes('from "./'), false);
    assert.equal(mcpSource.trim().startsWith('import type '), true);
    const runtimeImports = [...mcpSource.matchAll(/^import (?!type ).+$/gm)].map((m) => m[0]);
    assert.deepEqual(runtimeImports, []);
  });
});

describe('monster catalog payloads', () => {
  it('creates a type payload with required fields and combat attributes', () => {
    const payload = buildMonsterTypeCreatePayload({
      name: '  Drake  ',
      description: '  Winged reptiles.  ',
      genres: ['Fantasy'],
      minEncounterLevel: 4,
      defaultArchetype: 'Brute',
      immunities: ['Fire'],
      defaultAffinity: 'Fire',
    });

    assert.deepEqual(payload, {
      name: 'Drake',
      description: 'Winged reptiles.',
      genres: ['Fantasy'],
      minEncounterLevel: 4,
      defaultArchetype: 'Brute',
      immunities: ['Fire'],
      defaultAffinity: 'Fire',
      enabled: true,
    });
  });

  it('defaults create-type genres and level when omitted', () => {
    const payload = buildMonsterTypeCreatePayload({
      name: 'Ooze',
      description: 'Amorphous hunters.',
    });
    assert.deepEqual(payload.genres, ['Fantasy']);
    assert.equal(payload.minEncounterLevel, 1);
    assert.equal(payload.enabled, true);
  });

  it('rejects a blank type name and unknown genre', () => {
    assert.throws(
      () => buildMonsterTypeCreatePayload({ name: '  ', description: 'body' }),
      /Name Is Required/
    );
    assert.throws(
      () =>
        buildMonsterTypeCreatePayload({
          name: 'Ooze',
          description: 'body',
          genres: ['Noir'],
        }),
      /Genre Must Be One Of/
    );
  });

  it('builds a partial type update and rejects an empty patch', () => {
    assert.deepEqual(buildMonsterTypeUpdatePayload({ immunities: ['Cold'], enabled: false }), {
      immunities: ['Cold'],
      enabled: false,
    });
    assert.throws(() => buildMonsterTypeUpdatePayload({}), /At Least One Type Attribute/);
  });

  it('creates a subtype payload with identity defaults', () => {
    const payload = buildMonsterSubtypeCreatePayload({
      name: '  Ember Drake  ',
      visualDescription: '  A small dragon wreathed in coals.  ',
    });
    assert.deepEqual(payload, {
      name: 'Ember Drake',
      visualDescription: 'A small dragon wreathed in coals.',
      size: 'Medium',
      allowedTerrains: ['Plains'],
      encounterExcluded: false,
      rideable: false,
      enabled: true,
      archetype: null,
    });
  });

  it('builds a partial subtype update and rejects an empty patch', () => {
    assert.deepEqual(
      buildMonsterSubtypeUpdatePayload({
        visualDescription: 'Updated look',
        allowedTerrains: ['Desert', 'Mountain'],
      }),
      {
        visualDescription: 'Updated look',
        allowedTerrains: ['Desert', 'Mountain'],
      }
    );
    assert.throws(() => buildMonsterSubtypeUpdatePayload({}), /At Least One Subtype Attribute/);
  });

  it('normalizes list responses to { types }', () => {
    assert.deepEqual(normalizeMonsterTypesList({ types: [{ id: '1' }] }), { types: [{ id: '1' }] });
    assert.deepEqual(normalizeMonsterTypesList([{ id: '2' }]), { types: [{ id: '2' }] });
    assert.deepEqual(normalizeMonsterTypesList({}), { types: [] });
  });
});

describe('monster catalog MCP tools', () => {
  const catalog = {
    types: [
      {
        id: 'type-1',
        name: 'Beast',
        description: 'Natural animals.',
        genres: ['Fantasy'],
        minEncounterLevel: 1,
        immunities: [],
        subtypes: [
          {
            id: 'sub-1',
            name: 'Grassland Prowler',
            visualDescription: 'A plains wolf.',
            size: 'Medium',
            allowedTerrains: ['Plains'],
          },
        ],
      },
    ],
  };

  it('lists types with subtypes via the game admin route', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const output = await executeMcpTool(
      'list_monster_types',
      {},
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return catalog;
        },
      }
    );

    assert.deepEqual(calls, [{ path: '/api/admin/monster-types?includeSubtypes=1', init: undefined }]);
    assert.deepEqual(output, catalog);
    const types = (output as { types: { subtypes: unknown[] }[] }).types;
    assert.equal(types[0].subtypes.length, 1);
  });

  it('gets one type by id', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const output = await executeMcpTool(
      'get_monster_type',
      { id: 'type-1' },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { type: catalog.types[0] };
        },
      }
    );

    assert.deepEqual(calls, [{ path: '/api/admin/monster-types/type-1', init: undefined }]);
    assert.equal((output as { type: { name: string } }).type.name, 'Beast');
  });

  it('rejects get/update without an id', async () => {
    await assert.rejects(() => executeMcpTool('get_monster_type', {}, { fetchRpgAdmin: async () => ({}) }), /Id Is Required/);
    await assert.rejects(
      () => executeMcpTool('update_monster_type', { description: 'x' }, { fetchRpgAdmin: async () => ({}) }),
      /Id Is Required/
    );
    await assert.rejects(
      () =>
        executeMcpTool(
          'create_monster_subtype',
          { name: 'X', visualDescription: 'Y' },
          { fetchRpgAdmin: async () => ({}) }
        ),
      /Type Id Is Required/
    );
  });

  it('forwards create/update type payloads to the game admin routes', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const created = await executeMcpTool(
      'create_monster_type',
      {
        name: 'Drake',
        description: 'Winged reptiles.',
        genres: ['Fantasy'],
        defaultArchetype: 'Brute',
        immunities: ['Fire'],
      },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { type: { id: 'type-9' } };
        },
      }
    );

    assert.equal(calls[0].path, '/api/admin/monster-types');
    assert.equal(calls[0].init?.method, 'POST');
    const createdBody = JSON.parse(String(calls[0].init?.body));
    assert.equal(createdBody.name, 'Drake');
    assert.deepEqual(createdBody.immunities, ['Fire']);
    assert.equal(createdBody.enabled, true);
    assert.deepEqual((created as { result: { type: { id: string } } }).result, { type: { id: 'type-9' } });

    const updated = await executeMcpTool(
      'update_monster_type',
      { id: 'type-9', immunities: ['Fire', 'Cold'], enabled: false },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { type: { id: 'type-9' } };
        },
      }
    );

    assert.equal(calls[1].path, '/api/admin/monster-types/type-9');
    assert.equal(calls[1].init?.method, 'PATCH');
    const updatedBody = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(updatedBody, { immunities: ['Fire', 'Cold'], enabled: false });
    assert.equal('id' in updatedBody, false);
    assert.equal((updated as { ok: boolean }).ok, true);
  });

  it('forwards create/update subtype payloads under the parent type', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'create_monster_subtype',
      {
        typeId: 'type-1',
        name: 'Ember Drake',
        visualDescription: 'A small dragon wreathed in coals.',
        size: 'Large',
        allowedTerrains: ['Mountain'],
      },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );

    assert.equal(calls[0].path, '/api/admin/monster-types/type-1/subtypes');
    assert.equal(calls[0].init?.method, 'POST');
    const createdBody = JSON.parse(String(calls[0].init?.body));
    assert.equal(createdBody.name, 'Ember Drake');
    assert.equal(createdBody.size, 'Large');
    assert.deepEqual(createdBody.allowedTerrains, ['Mountain']);
    assert.equal(createdBody.encounterExcluded, false);
    assert.equal('typeId' in createdBody, false);

    await executeMcpTool(
      'update_monster_subtype',
      {
        typeId: 'type-1',
        subtypeId: 'sub-9',
        visualDescription: 'Updated look',
        rideable: true,
      },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );

    assert.equal(calls[1].path, '/api/admin/monster-types/type-1/subtypes/sub-9');
    assert.equal(calls[1].init?.method, 'PATCH');
    const updatedBody = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(updatedBody, { visualDescription: 'Updated look', rideable: true });
    assert.equal('typeId' in updatedBody, false);
    assert.equal('subtypeId' in updatedBody, false);
  });

  it('surfaces game admin auth/config errors without live credentials', async () => {
    delete process.env.ADMIN_API_KEY;
    delete process.env.RPG_API_URL;
    delete process.env.VITE_RPG_API_URL;

    await assert.rejects(() => executeMcpTool('list_monster_types', {}), /RPG_API_URL is not configured/);

    process.env.RPG_API_URL = 'https://game.example';
    await assert.rejects(() => executeMcpTool('list_monster_types', {}), /ADMIN_API_KEY is not configured/);
    delete process.env.RPG_API_URL;
  });

  it('forwards Bearer and x-admin-key on the game admin request', async () => {
    process.env.RPG_API_URL = 'https://game.example';
    process.env.ADMIN_API_KEY = 'admin-secret';
    const originalFetch = globalThis.fetch;
    const calls: { url: string; headers: Record<string, string> }[] = [];

    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      calls.push({
        url: String(url),
        headers: (init?.headers || {}) as Record<string, string>,
      });
      return {
        ok: true,
        json: async () => catalog,
      } as Response;
    }) as typeof fetch;

    try {
      const output = await executeMcpTool('list_monster_types', {});
      assert.equal(calls[0].url, 'https://game.example/api/admin/monster-types?includeSubtypes=1');
      assert.equal(calls[0].headers.Authorization, 'Bearer admin-secret');
      assert.equal(calls[0].headers['x-admin-key'], 'admin-secret');
      assert.deepEqual(output, catalog);
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.RPG_API_URL;
      delete process.env.ADMIN_API_KEY;
    }
  });

  it('returns list_monster_types through tools/call as MCP text content', async () => {
    const result = await dispatchMcpMessage(
      {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'list_monster_types', arguments: {} },
      },
      {
        fetchRpgAdmin: async () => catalog,
      }
    );
    assert.equal(result.kind, 'response');
    if (result.kind !== 'response') return;
    const payload = result.response.result as {
      isError: boolean;
      content: { type: string; text: string }[];
    };
    assert.equal(payload.isError, false);
    const parsed = JSON.parse(payload.content[0].text);
    assert.equal(parsed.types[0].name, 'Beast');
    assert.equal(parsed.types[0].subtypes[0].name, 'Grassland Prowler');
  });
});
