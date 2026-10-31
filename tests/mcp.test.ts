import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import handler, {
  buildMonsterCombatFlavorUpdatePayload,
  buildMonsterSubtypeCreatePayload,
  buildMonsterSubtypeUpdatePayload,
  buildMonsterTypeCreatePayload,
  buildMonsterTypeUpdatePayload,
  buildPatchNotePayload,
  dispatchMcpMessage,
  executeMcpTool,
  extractBearerToken,
  formatAnalyticsOverview,
  insertMcpAuditLog,
  isAuthorizedMcpRequest,
  MCP_TOOLS,
  normalizeMonsterTypesList,
  normalizePatchNotesList,
  resetMcpWriteRateLimits,
  resolveMcpPrincipal,
  sha256Hex,
  sortPatchNotesNewestFirst,
  type McpAuditEvent,
  type McpPrincipal,
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
  'update_monster_combat_flavor',
  'list_ships',
  'create_ship',
  'update_ship',
];

const KEY = 'test-mcp-key-please-ignore';

afterEach(() => {
  delete process.env.MCP_API_KEY;
  delete process.env.MCP_API_KEYS;
  delete process.env.MCP_WRITE_LIMIT_PER_MIN;
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  resetMcpWriteRateLimits();
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

  it('marks every response Cache-Control: no-store so tool lists are never cached', async () => {
    process.env.MCP_API_KEY = KEY;
    const res = mockResponse();
    await handler(
      mockRequest({
        headers: { authorization: `Bearer ${KEY}` },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      }),
      res.response
    );
    assert.equal(res.state.statusCode, 200);
    assert.equal(res.state.headers['Cache-Control'], 'no-store');
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
  it('matches createNews fields with an unpublished draft and is_popup false', () => {
    const payload = buildPatchNotePayload({
      title: '  Early Access v0.62  ',
      content: '<p>Fixes</p>',
      version: ' v0.62 ',
    });

    assert.deepEqual(payload, {
      title: 'Early Access v0.62',
      content: '<p>Fixes</p>',
      imageUrl: null,
      published: false,
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
    assert.equal(payload.published, false);

    const tool = MCP_TOOLS.find((entry) => entry.name === 'publish_patch_note');
    assert.ok(tool);
    assert.match(tool.description, /unpublished/i);
    assert.match(tool.description, /published false/);
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
      const info = init.response.result as {
        protocolVersion: string;
        serverInfo: { name: string; version: string };
        capabilities: { tools: { listChanged: boolean } };
        instructions: string;
      };
      assert.equal(info.protocolVersion, '2025-03-26');
      assert.equal(info.serverInfo.name, 'heroic-dashboard');
      assert.equal(info.serverInfo.version, '1.3.0');
      assert.equal(info.capabilities.tools.listChanged, true);
      assert.match(info.instructions, /never null/);
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
    assert.equal(record.published, false);
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
      defaultArchetype: 'Brute',
      immunities: ['Fire'],
      defaultAffinity: 'Fire',
    });

    assert.deepEqual(payload, {
      name: 'Drake',
      description: 'Winged reptiles.',
      genres: ['Fantasy'],
      defaultArchetype: 'Brute',
      immunities: ['Fire'],
      defaultAffinity: 'Fire',
      canSpeak: false,
      enabled: true,
    });
  });

  it('defaults create-type genres when omitted and never sends a type level', () => {
    const payload = buildMonsterTypeCreatePayload({
      name: 'Ooze',
      description: 'Amorphous hunters.',
    });
    assert.deepEqual(payload.genres, ['Fantasy']);
    assert.equal('minEncounterLevel' in payload, false);
    assert.equal(payload.enabled, true);
  });

  it('rejects minEncounterLevel on type create / update', () => {
    assert.throws(
      () => buildMonsterTypeCreatePayload({ name: 'Ooze', description: 'body', minEncounterLevel: 4 }),
      /Min Encounter Level Is Set Per Subtype/
    );
    assert.throws(
      () => buildMonsterTypeUpdatePayload({ minEncounterLevel: 4 }),
      /Min Encounter Level Is Set Per Subtype/
    );
  });

  it('passes subtype minEncounterLevel through create / update and rejects invalid levels', () => {
    assert.equal(
      buildMonsterSubtypeCreatePayload({ name: 'Wyrmling', visualDescription: 'A young dragon.', minEncounterLevel: 12 })
        .minEncounterLevel,
      12
    );
    assert.deepEqual(buildMonsterSubtypeUpdatePayload({ minEncounterLevel: 30 }), { minEncounterLevel: 30 });
    for (const minEncounterLevel of [0, -1, 2.5, '5', null, Number.NaN]) {
      assert.throws(
        () => buildMonsterSubtypeUpdatePayload({ minEncounterLevel }),
        /Min Encounter Level Must Be A Whole Number Of At Least 1/
      );
    }
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
      canSpeak: null,
      spawnRank: 'any',
      minEncounterLevel: 1,
      enabled: true,
      archetype: null,
    });
  });

  it('passes subtype spawnRank through create / update and rejects unknown ranks', () => {
    assert.equal(
      buildMonsterSubtypeCreatePayload({ name: 'Balor', visualDescription: 'A flaming demon.', spawnRank: 'boss_only' })
        .spawnRank,
      'boss_only'
    );
    assert.deepEqual(buildMonsterSubtypeUpdatePayload({ spawnRank: 'any' }), { spawnRank: 'any' });
    assert.deepEqual(buildMonsterSubtypeUpdatePayload({ spawnRank: 'BOSS_ONLY' }), { spawnRank: 'boss_only' });
    for (const spawnRank of ['boss', 'elite_up', null, true]) {
      assert.throws(
        () => buildMonsterSubtypeUpdatePayload({ spawnRank }),
        /Spawn Rank must be any or boss_only/
      );
    }
  });

  it('passes canSpeak through type create / update', () => {
    assert.equal(
      buildMonsterTypeCreatePayload({ name: 'Wyrm', description: 'Old dragons.', canSpeak: true }).canSpeak,
      true
    );
    assert.deepEqual(buildMonsterTypeUpdatePayload({ canSpeak: false }), { canSpeak: false });
    assert.throws(() => buildMonsterTypeUpdatePayload({ canSpeak: null }), /Can Speak Must Be A Boolean/);
  });

  it('round-trips subtype canSpeak overrides and null inherit', () => {
    assert.equal(
      buildMonsterSubtypeCreatePayload({ name: 'Imp', visualDescription: 'A small devil.', canSpeak: true }).canSpeak,
      true
    );
    assert.deepEqual(buildMonsterSubtypeUpdatePayload({ canSpeak: false }), { canSpeak: false });
    assert.deepEqual(buildMonsterSubtypeUpdatePayload({ canSpeak: null }), { canSpeak: null });
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ canSpeak: 'yes' }),
      /Can Speak Must Be A Boolean Or Null/
    );
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

  it('builds combatFlavor on subtype update and incremental flavor patches', () => {
    const grenadierSlot = {
      name: 'Rime Grenade',
      description: 'A frost charge that detonates on impact.',
      damageType: 'Cold',
      targetType: 'Multiple',
      saveAbility: 'dexterity',
      saveEffect: 'half',
    };
    assert.deepEqual(
      buildMonsterSubtypeUpdatePayload({
        combatFlavor: {
          Brute: {
            description: 'A frost-rimed hulk.',
            attacks: [{ name: 'Rime Slam', description: 'Ice fists.' }],
          },
        },
      }),
      {
        combatFlavor: {
          Brute: {
            description: 'A frost-rimed hulk.',
            attacks: [{ name: 'Rime Slam', description: 'Ice fists.' }],
          },
        },
      }
    );
    assert.deepEqual(
      buildMonsterSubtypeUpdatePayload({
        combatFlavor: {
          Grenadier: {
            description: 'A bombardier that saturates the field.',
            specialAbilities: [grenadierSlot],
          },
        },
      }),
      {
        combatFlavor: {
          Grenadier: {
            description: 'A bombardier that saturates the field.',
            specialAbilities: [grenadierSlot],
          },
        },
      }
    );
    assert.throws(
      () =>
        buildMonsterSubtypeUpdatePayload({
          combatFlavor: { Custom: { description: 'Nope' } },
        }),
      /Unknown Combat Template Key/
    );
    assert.throws(
      () =>
        buildMonsterSubtypeUpdatePayload({
          combatFlavor: {
            Brute: {
              attacks: [{ name: 'Slam', description: 'Hits.', damageType: 'Ice' }],
            },
          },
        }),
      /damageType Must Be One Of/
    );
    assert.throws(
      () =>
        buildMonsterSubtypeUpdatePayload({
          combatFlavor: {
            Brute: {
              specialAbilities: [{ name: 'Burst', description: 'Explodes.', target: 'Multiple' }],
            },
          },
        }),
      /Unknown Key: target/
    );
    assert.deepEqual(
      buildMonsterCombatFlavorUpdatePayload({
        template: 'Brute',
        description: 'A frost-rimed hulk.',
        attacks: [{ name: 'Rime Slam', description: 'Ice fists.' }],
      }),
      {
        combatFlavor: {
          Brute: {
            description: 'A frost-rimed hulk.',
            attacks: [{ name: 'Rime Slam', description: 'Ice fists.' }],
          },
        },
      }
    );
    assert.deepEqual(
      buildMonsterCombatFlavorUpdatePayload({
        template: 'Grenadier',
        specialAbilities: [grenadierSlot],
      }),
      {
        combatFlavor: {
          Grenadier: {
            specialAbilities: [grenadierSlot],
          },
        },
      }
    );
    assert.throws(() => buildMonsterCombatFlavorUpdatePayload({ template: 'Custom' }), /Unknown Combat Template/);
    assert.throws(
      () => buildMonsterCombatFlavorUpdatePayload({ template: 'Brute', attacks: [] }),
      /Must Include description, attacks, Or specialAbilities/
    );
    assert.throws(
      () =>
        buildMonsterCombatFlavorUpdatePayload({
          template: 'Brute',
          attacks: [{ name: 'Slam', description: 'Hits.', damageDice: '1d8' }],
        }),
      /Unknown Key: damageDice/
    );
    assert.throws(
      () =>
        buildMonsterCombatFlavorUpdatePayload({
          template: 'Brute',
          specialAbilities: [{ name: 'Burst', description: 'Explodes.', saveEffect: 'none' }],
        }),
      /saveEffect Must Be One Of/
    );
    assert.deepEqual(
      buildMonsterCombatFlavorUpdatePayload({
        template: 'Brute',
        attacks: [{ name: 'Rime Slam', description: 'Ice fists.', damageType: '  Fire  ' }],
      }),
      {
        combatFlavor: {
          Brute: {
            attacks: [{ name: 'Rime Slam', description: 'Ice fists.', damageType: 'Fire' }],
          },
        },
      }
    );
    assert.deepEqual(
      buildMonsterSubtypeUpdatePayload({
        combatFlavor: { Brute: null },
      }),
      {
        combatFlavor: { Brute: null },
      }
    );
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
            combatFlavor: {
              Grenadier: {
                description: 'A bombardier that saturates the field.',
                specialAbilities: [
                  {
                    name: 'Rime Grenade',
                    description: 'A frost charge that detonates on impact.',
                    damageType: 'Cold',
                    targetType: 'Multiple',
                    saveAbility: 'dexterity',
                    saveEffect: 'half',
                  },
                ],
              },
            },
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
    assert.deepEqual((types[0].subtypes[0] as { combatFlavor: unknown }).combatFlavor, catalog.types[0].subtypes[0].combatFlavor);
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
        combatFlavor: {
          Grenadier: {
            description: 'A bombardier that saturates the field.',
            specialAbilities: [
              {
                name: 'Rime Grenade',
                description: 'A frost charge that detonates on impact.',
                damageType: 'Cold',
                targetType: 'Multiple',
                saveAbility: 'dexterity',
                saveEffect: 'half',
              },
            ],
          },
        },
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
    assert.deepEqual(createdBody.combatFlavor, {
      Grenadier: {
        description: 'A bombardier that saturates the field.',
        specialAbilities: [
          {
            name: 'Rime Grenade',
            description: 'A frost charge that detonates on impact.',
            damageType: 'Cold',
            targetType: 'Multiple',
            saveAbility: 'dexterity',
            saveEffect: 'half',
          },
        ],
      },
    });

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

    await executeMcpTool(
      'update_monster_combat_flavor',
      {
        typeId: 'type-1',
        subtypeId: 'sub-9',
        template: 'Grenadier',
        description: 'A bombardier that saturates the field.',
        specialAbilities: [
          {
            name: 'Rime Grenade',
            description: 'A frost charge that detonates on impact.',
            damageType: 'Cold',
            targetType: 'Multiple',
            saveAbility: 'dexterity',
            saveEffect: 'half',
          },
        ],
      },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );

    assert.equal(calls[2].path, '/api/admin/monster-types/type-1/subtypes/sub-9');
    assert.equal(calls[2].init?.method, 'PATCH');
    const flavorBody = JSON.parse(String(calls[2].init?.body));
    assert.deepEqual(flavorBody, {
      combatFlavor: {
        Grenadier: {
          description: 'A bombardier that saturates the field.',
          specialAbilities: [
            {
              name: 'Rime Grenade',
              description: 'A frost charge that detonates on impact.',
              damageType: 'Cold',
              targetType: 'Multiple',
              saveAbility: 'dexterity',
              saveEffect: 'half',
            },
          ],
        },
      },
    });
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

describe('MCP monster canSpeak', () => {
  const toolProps = (toolName: string) => {
    const tool = MCP_TOOLS.find((entry) => entry.name === toolName);
    return (tool?.inputSchema as { properties: Record<string, any> }).properties;
  };

  it('exposes canSpeak as a boolean on type tools and nullable boolean on subtype tools', () => {
    for (const toolName of ['create_monster_type', 'update_monster_type']) {
      assert.equal(toolProps(toolName).canSpeak.type, 'boolean');
    }
    for (const toolName of ['create_monster_subtype', 'update_monster_subtype']) {
      assert.deepEqual(toolProps(toolName).canSpeak.type, ['boolean', 'null']);
    }
  });

  it('forwards a subtype canSpeak reset to inherit on update', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'update_monster_subtype',
      { typeId: 'type-1', subtypeId: 'sub-9', canSpeak: null },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );
    assert.equal(calls[0].init?.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { canSpeak: null });
  });
});

describe('MCP monster spawnRank', () => {
  const toolProps = (toolName: string) => {
    const tool = MCP_TOOLS.find((entry) => entry.name === toolName);
    return (tool?.inputSchema as { properties: Record<string, any> }).properties;
  };

  it('exposes spawnRank as an any / boss_only enum on subtype tools only', () => {
    for (const toolName of ['create_monster_subtype', 'update_monster_subtype']) {
      assert.deepEqual(toolProps(toolName).spawnRank.enum, ['any', 'boss_only']);
    }
    for (const toolName of ['create_monster_type', 'update_monster_type']) {
      assert.equal(toolProps(toolName).spawnRank, undefined);
    }
  });

  it('forwards a subtype spawnRank change on update', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'update_monster_subtype',
      { typeId: 'type-1', subtypeId: 'sub-9', spawnRank: 'boss_only' },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );
    assert.equal(calls[0].init?.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { spawnRank: 'boss_only' });
  });
});

describe('MCP monster minEncounterLevel', () => {
  const toolProps = (toolName: string) => {
    const tool = MCP_TOOLS.find((entry) => entry.name === toolName);
    return (tool?.inputSchema as { properties: Record<string, any> }).properties;
  };

  it('exposes minEncounterLevel on subtype tools only', () => {
    for (const toolName of ['create_monster_subtype', 'update_monster_subtype']) {
      assert.equal(toolProps(toolName).minEncounterLevel.type, 'integer');
      assert.equal(toolProps(toolName).minEncounterLevel.minimum, 1);
      assert.match(toolProps(toolName).minEncounterLevel.description, /null is rejected/);
    }
    for (const toolName of ['create_monster_type', 'update_monster_type']) {
      assert.equal(toolProps(toolName).minEncounterLevel, undefined);
    }
  });

  it('forwards a subtype minEncounterLevel change on update', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'update_monster_subtype',
      { typeId: 'type-1', subtypeId: 'sub-9', minEncounterLevel: 20 },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );
    assert.equal(calls[0].path, '/api/admin/monster-types/type-1/subtypes/sub-9');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { minEncounterLevel: 20 });
  });
});

describe('MCP monster subtype genres', () => {
  const toolProps = (toolName: string) => {
    const tool = MCP_TOOLS.find((entry) => entry.name === toolName);
    return (tool?.inputSchema as { properties: Record<string, any> }).properties;
  };

  it('exposes genres on subtype tools as a unique genre list', () => {
    for (const toolName of ['create_monster_subtype', 'update_monster_subtype']) {
      const genres = toolProps(toolName).genres;
      assert.equal(genres.type, 'array');
      assert.deepEqual(genres.items.enum, ['Fantasy', 'Modern', 'Sci-Fi']);
      assert.equal(genres.uniqueItems, true);
      assert.match(genres.description, /inherits the type genres/);
    }
  });

  it('omits genres on create when not sent and dedupes when sent', () => {
    const omitted = buildMonsterSubtypeCreatePayload({ name: 'Reef Ray', visualDescription: 'A flat ray.' });
    assert.equal('genres' in omitted, false);

    const tagged = buildMonsterSubtypeCreatePayload({
      name: 'Reef Ray',
      visualDescription: 'A flat ray.',
      genres: ['Modern', 'Sci-Fi', 'Modern'],
    });
    assert.deepEqual(tagged.genres, ['Modern', 'Sci-Fi']);
  });

  it('forwards a genre list and an empty list on update', async () => {
    for (const genres of [['Modern', 'Sci-Fi'], []]) {
      const calls: { path: string; init?: RequestInit }[] = [];
      await executeMcpTool(
        'update_monster_subtype',
        { typeId: 'type-1', subtypeId: 'sub-9', genres },
        {
          fetchRpgAdmin: async (path, init) => {
            calls.push({ path, init });
            return { subtype: { id: 'sub-9' } };
          },
        }
      );
      assert.equal(calls[0].path, '/api/admin/monster-types/type-1/subtypes/sub-9');
      assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { genres });
    }
  });

  it('rejects unknown genres without a write', async () => {
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ genres: ['Noir'] }),
      /Genre Must Be One Of Fantasy, Modern, Sci-Fi/
    );
    let called = false;
    await assert.rejects(
      () =>
        executeMcpTool(
          'update_monster_subtype',
          { typeId: 'type-1', subtypeId: 'sub-9', genres: ['Steampunk'] },
          {
            fetchRpgAdmin: async () => {
              called = true;
              return {};
            },
          }
        ),
      /Genre Must Be One Of/
    );
    assert.equal(called, false);
  });
});

describe('MCP RPG failure reporting', { concurrency: 1 }, () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    delete process.env.RPG_API_URL;
    delete process.env.ADMIN_API_KEY;
  });

  it('names method, path, status, and RPG error code when the game fails', async () => {
    process.env.RPG_API_URL = 'https://rpg.example.test/';
    process.env.ADMIN_API_KEY = 'admin-key-test';
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: 'Monster Catalog Database Is Out Of Date. Apply Pending Migrations.',
          code: 'P2022',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )) as typeof fetch;

    await assert.rejects(
      () => executeMcpTool('list_monster_types', {}),
      (error: Error) => {
        assert.equal(
          error.message,
          'RPG API GET /api/admin/monster-types?includeSubtypes=1 Returned 503: Monster Catalog Database Is Out Of Date. Apply Pending Migrations. (code P2022)'
        );
        return true;
      }
    );
  });

  it('logs a failing tools/call with key and tool name and returns isError', async () => {
    const logged: string[] = [];
    console.error = (...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    };

    const result = await dispatchMcpMessage(
      {
        jsonrpc: '2.0',
        id: 21,
        method: 'tools/call',
        params: { name: 'get_monster_type', arguments: { id: 'missing-type' } },
      },
      {
        principal: { name: 'monster-bot', scopes: ['read', 'monsters'] },
        fetchRpgAdmin: async () => {
          throw new Error('RPG API GET /api/admin/monster-types/missing-type Returned 404: Not Found');
        },
      }
    );

    assert.equal(result.kind, 'response');
    if (result.kind !== 'response') return;
    const payload = result.response.result as { isError: boolean; content: { text: string }[] };
    assert.equal(payload.isError, true);
    assert.match(payload.content[0].text, /Returned 404: Not Found/);
    assert.equal(logged.length, 1);
    assert.match(logged[0], /\[mcp\] tool "get_monster_type" failed for key "monster-bot": RPG API GET/);
  });
});

describe('MCP key scopes', { concurrency: 1 }, () => {
  const readSecret = 'read-scope-secret-not-real';
  const monsterSecret = 'monster-scope-secret-not-real';
  const notesSecret = 'notes-scope-secret-not-real';
  const legacySecret = 'legacy-scope-secret-not-real';

  function scopedEnv() {
    process.env.MCP_API_KEY = legacySecret;
    process.env.MCP_API_KEYS = JSON.stringify({
      reader: { sha256: createHash('sha256').update(readSecret).digest('hex'), scopes: ['read'] },
      bestiary: { key: monsterSecret, scopes: ['monsters'] },
      notes: {
        sha256: createHash('sha256').update(notesSecret).digest('hex'),
        key: 'ignored-because-sha256-wins',
        scopes: ['patch_notes'],
      },
    });
  }

  it('hashes bearer keys with the same SHA-256 hex as node:crypto', async () => {
    const sample = 'abc-key-sample';
    assert.equal(await sha256Hex(sample), createHash('sha256').update(sample).digest('hex'));
  });

  it('accepts a hashed read key and the legacy full-scope key', async () => {
    scopedEnv();
    const reader = await resolveMcpPrincipal(`Bearer ${readSecret}`);
    assert.deepEqual(reader, { name: 'reader', scopes: ['read'] });

    const legacy = await resolveMcpPrincipal(`Bearer ${legacySecret}`);
    assert.equal(legacy?.name, 'legacy');
    assert.deepEqual(legacy?.scopes, ['read', 'monsters', 'patch_notes']);

    const notes = await resolveMcpPrincipal(`Bearer ${notesSecret}`);
    assert.deepEqual(notes, { name: 'notes', scopes: ['patch_notes'] });
    assert.equal(await resolveMcpPrincipal('Bearer ignored-because-sha256-wins'), null);
  });

  it('prefers a named key when the same secret is also MCP_API_KEY', async () => {
    process.env.MCP_API_KEY = readSecret;
    process.env.MCP_API_KEYS = JSON.stringify({
      reader: { key: readSecret, scopes: ['read'] },
    });
    const principal = await resolveMcpPrincipal(`Bearer ${readSecret}`);
    assert.equal(principal?.name, 'reader');
    assert.deepEqual(principal?.scopes, ['read']);
  });

  it('returns 401 for a wrong key when only MCP_API_KEYS is set', async () => {
    delete process.env.MCP_API_KEY;
    process.env.MCP_API_KEYS = JSON.stringify({
      reader: { key: readSecret, scopes: ['read'] },
    });
    const res = mockResponse();
    await handler(
      mockRequest({ headers: { authorization: 'Bearer nope' }, body: { jsonrpc: '2.0', id: 1, method: 'ping' } }),
      res.response
    );
    assert.equal(res.state.statusCode, 401);
    assert.equal(JSON.stringify(res.state.body).includes(readSecret), false);
  });

  it('returns HTTP 500 for invalid MCP_API_KEYS without echoing the secret', async () => {
    process.env.MCP_API_KEY = legacySecret;
    process.env.MCP_API_KEYS = '{"broken" secret-value-do-not-echo';
    const res = mockResponse();
    await handler(
      mockRequest({
        headers: { authorization: `Bearer ${legacySecret}` },
        body: { jsonrpc: '2.0', id: 1, method: 'ping' },
      }),
      res.response
    );
    assert.equal(res.state.statusCode, 500);
    assert.deepEqual(res.state.body, { error: 'MCP_API_KEYS Is Invalid JSON.' });
    assert.equal(JSON.stringify(res.state.body).includes('secret-value-do-not-echo'), false);
  });

  it('lists only read tools for a read key and rejects monster writes', async () => {
    scopedEnv();
    const listed = mockResponse();
    await handler(
      mockRequest({
        headers: { authorization: `Bearer ${readSecret}`, accept: 'application/json' },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      }),
      listed.response
    );
    assert.equal(listed.state.statusCode, 200);
    const names = (
      listed.state.body as { result: { tools: { name: string }[] } }
    ).result.tools.map((tool) => tool.name);
    assert.deepEqual(names, [
      'get_insights',
      'list_patch_notes',
      'list_monster_types',
      'get_monster_type',
      'list_ships',
    ]);

    const denied = mockResponse();
    await handler(
      mockRequest({
        headers: { authorization: `Bearer ${readSecret}` },
        body: {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: { name: 'create_monster_type', arguments: { name: 'Drake', description: 'Wings' } },
        },
      }),
      denied.response
    );
    assert.equal(denied.state.statusCode, 200);
    const payload = denied.state.body as { result: { isError: boolean; content: { text: string }[] } };
    assert.equal(payload.result.isError, true);
    assert.match(payload.result.content[0].text, /Missing Scope: monsters/);
    assert.equal(payload.result.content[0].text.includes(readSecret), false);
  });

  it('lets a monsters key create and blocks patch notes', async () => {
    const principal: McpPrincipal = { name: 'bestiary', scopes: ['monsters'] };
    let posted = false;
    const created = await executeMcpTool(
      'create_monster_type',
      { name: 'Drake', description: 'Wings' },
      {
        principal,
        recordAudit: async () => {},
        fetchRpgAdmin: async () => {
          posted = true;
          return { id: 'type-1' };
        },
      }
    );
    assert.equal(posted, true);
    assert.equal((created as { result: { id: string } }).result.id, 'type-1');

    await assert.rejects(
      () =>
        executeMcpTool(
          'publish_patch_note',
          { title: 'Draft', content: 'Body' },
          { principal, publishPatchNote: async () => ({ id: 'should-not-run' }) }
        ),
      /Missing Scope: patch_notes/
    );
  });

  it('lets the legacy key call a patch-note write', async () => {
    scopedEnv();
    const principal = await resolveMcpPrincipal(`Bearer ${legacySecret}`);
    assert.ok(principal);
    const output = await executeMcpTool(
      'publish_patch_note',
      { title: 'Legacy draft', content: 'Body', version: 'v9' },
      {
        principal: principal ?? undefined,
        recordAudit: async () => {},
        publishPatchNote: async (payload) => {
          assert.equal(payload.published, false);
          return { id: 'news-legacy' };
        },
      }
    );
    assert.equal((output as { result: { id: string } }).result.id, 'news-legacy');
  });
});

describe('MCP write audit', { concurrency: 1 }, () => {
  const principal: McpPrincipal = { name: 'notes', scopes: ['patch_notes', 'monsters'] };
  const now = Date.parse('2026-10-15T12:00:00.000Z');

  it('records key name, tool, target id, diff summary, and timestamp', async () => {
    const events: McpAuditEvent[] = [];
    const output = await executeMcpTool(
      'publish_patch_note',
      { title: 'Early Access v0.70', content: '<p>secret body</p>', version: 'v0.70' },
      {
        principal,
        now: () => now,
        recordAudit: async (event) => {
          events.push(event);
        },
        publishPatchNote: async (payload) => {
          assert.equal(payload.published, false);
          return { id: 'news-70' };
        },
      }
    );
    assert.equal((output as { ok: boolean }).ok, true);
    assert.equal(events.length, 1);
    assert.equal(events[0].keyName, 'notes');
    assert.equal(events[0].tool, 'publish_patch_note');
    assert.equal(events[0].targetId, 'news-70');
    assert.equal(events[0].createdAt, '2026-10-15T12:00:00.000Z');
    assert.match(events[0].diffSummary, /published=false/);
    assert.match(events[0].diffSummary, /title="Early Access v0.70"/);
    assert.equal(events[0].diffSummary.includes('secret body'), false);
  });

  it('records monster update ids from the arguments', async () => {
    const events: McpAuditEvent[] = [];
    await executeMcpTool(
      'update_monster_subtype',
      { typeId: 'type-1', subtypeId: 'sub-9', visualDescription: 'Updated look' },
      {
        principal,
        now: () => now,
        recordAudit: async (event) => {
          events.push(event);
        },
        fetchRpgAdmin: async () => ({ id: 'sub-9' }),
      }
    );
    assert.equal(events[0].tool, 'update_monster_subtype');
    assert.equal(events[0].targetId, 'sub-9');
    assert.match(events[0].diffSummary, /fields=visualDescription/);
  });

  it('still returns the write when the audit insert fails', async () => {
    const lines: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      lines.push(args.map((part) => String(part)).join(' '));
    };
    try {
      const output = await executeMcpTool(
        'publish_patch_note',
        { title: 'Draft', content: 'Body' },
        {
          principal,
          now: () => now,
          recordAudit: async () => {
            throw new Error('insert failed');
          },
          publishPatchNote: async () => ({ id: 'news-ok' }),
        }
      );
      assert.equal((output as { result: { id: string } }).result.id, 'news-ok');
      assert.match(lines.join('\n'), /audit log insert failed for key "notes" tool "publish_patch_note": insert failed/);
      assert.equal(lines.join('\n').includes('notes-scope-secret-not-real'), false);
      assert.equal(lines.join('\n').includes('service-role'), false);
    } finally {
      console.error = original;
    }
  });

  it('posts an audit row to Supabase and logs when service role is missing', async () => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-fake';
    const originalFetch = globalThis.fetch;
    const calls: { url: string; init?: RequestInit }[] = [];
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(null, { status: 201 });
    }) as typeof fetch;
    try {
      await insertMcpAuditLog({
        keyName: 'notes',
        tool: 'publish_patch_note',
        targetId: 'news-1',
        diffSummary: 'draft published=false',
        createdAt: '2026-10-15T12:00:00.000Z',
      });
      assert.equal(calls[0].url, 'https://example.supabase.co/rest/v1/mcp_audit_log');
      const headers = calls[0].init?.headers as Record<string, string>;
      assert.equal(headers.apikey, 'service-role-fake');
      assert.equal(headers.Authorization, 'Bearer service-role-fake');
      const body = JSON.parse(String(calls[0].init?.body));
      assert.deepEqual(body, {
        key_name: 'notes',
        tool: 'publish_patch_note',
        target_id: 'news-1',
        diff_summary: 'draft published=false',
        created_at: '2026-10-15T12:00:00.000Z',
      });
    } finally {
      globalThis.fetch = originalFetch;
    }

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const lines: string[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      lines.push(args.map((part) => String(part)).join(' '));
    };
    try {
      const output = await executeMcpTool(
        'create_monster_type',
        { name: 'Ooze', description: 'Amorphous' },
        {
          principal: { name: 'bestiary', scopes: ['monsters'] },
          now: () => now,
          fetchRpgAdmin: async () => ({ id: 'type-2' }),
        }
      );
      assert.equal((output as { result: { id: string } }).result.id, 'type-2');
      assert.match(lines.join('\n'), /Supabase service role is not configured/);
    } finally {
      console.error = original;
    }
  });
});

describe('MCP write rate limit', { concurrency: 1 }, () => {
  const now = 1_700_000_000_000;

  it('caps writes per key per minute and resets on the next window', async () => {
    const principal: McpPrincipal = { name: 'bestiary', scopes: ['monsters'] };
    let calls = 0;
    const runtime = {
      principal,
      writeLimitPerMin: 2,
      now: () => now,
      recordAudit: async () => {},
      fetchRpgAdmin: async () => {
        calls += 1;
        return { id: 'type-1' };
      },
    };
    await executeMcpTool('create_monster_type', { name: 'One', description: 'A' }, runtime);
    await executeMcpTool('create_monster_type', { name: 'Two', description: 'B' }, runtime);
    await assert.rejects(
      () => executeMcpTool('create_monster_type', { name: 'Three', description: 'C' }, runtime),
      /Write Rate Limit Exceeded\. Key "bestiary" Is Limited To 2 Writes Per Minute\./
    );
    assert.equal(calls, 2);

    const other: McpPrincipal = { name: 'other-bot', scopes: ['monsters'] };
    await executeMcpTool('create_monster_type', { name: 'Four', description: 'D' }, {
      ...runtime,
      principal: other,
    });
    assert.equal(calls, 3);

    await executeMcpTool(
      'create_monster_type',
      { name: 'Five', description: 'E' },
      { ...runtime, now: () => now + 60_000 }
    );
    assert.equal(calls, 4);
  });

  it('does not count read tools toward the write cap', async () => {
    const principal: McpPrincipal = { name: 'reader', scopes: ['read', 'patch_notes'] };
    await executeMcpTool('get_insights', {}, { principal, writeLimitPerMin: 1, getInsights: async () => ({ ok: true }) });
    await executeMcpTool('get_insights', {}, { principal, writeLimitPerMin: 1, getInsights: async () => ({ ok: true }) });
    const output = await executeMcpTool(
      'publish_patch_note',
      { title: 'Draft', content: 'Body' },
      {
        principal,
        writeLimitPerMin: 1,
        recordAudit: async () => {},
        publishPatchNote: async (payload) => {
          assert.equal(payload.published, false);
          return { id: 'news-draft' };
        },
      }
    );
    assert.equal((output as { result: { id: string } }).result.id, 'news-draft');
  });
});

describe('public patch notes stay published-only', () => {
  it('drops explicit drafts and keeps live rows that omit published', () => {
    const items = normalizePatchNotesList({
      patchNotes: [
        { id: 'live', title: 'v0.66', version: 'v0.66' },
        { id: 'draft', title: 'v0.67', published: false },
        { id: 'public', title: 'v0.65', published: true },
      ],
    });
    assert.deepEqual(
      items.map((item) => item.id),
      ['live', 'public']
    );
  });
});

describe('MCP subtype movement modes', () => {
  const subtypeSchema = (toolName: string) => {
    const tool = MCP_TOOLS.find((entry) => entry.name === toolName);
    return (tool?.inputSchema as { properties: Record<string, any> }).properties;
  };

  it('lists movementModes and primaryMovementMode on create and update tools', () => {
    for (const toolName of ['create_monster_subtype', 'update_monster_subtype']) {
      const props = subtypeSchema(toolName);
      assert.deepEqual(props.movementModes.items.enum, ['ground', 'fly', 'climb', 'swim']);
      assert.equal(props.movementModes.minItems, 1);
      assert.equal(props.movementModes.uniqueItems, true);
      assert.deepEqual(props.primaryMovementMode.enum, ['ground', 'fly', 'climb', 'swim', null]);
    }
    const create = MCP_TOOLS.find((entry) => entry.name === 'create_monster_subtype');
    assert.match(create?.description || '', /AI assign/);
  });

  it('normalises, dedupes, and keeps the order of movement modes', () => {
    const payload = buildMonsterSubtypeUpdatePayload({
      movementModes: [' Fly', 'climb', 'FLY'],
      primaryMovementMode: 'Fly',
    });
    assert.deepEqual(payload, { movementModes: ['fly', 'climb'], primaryMovementMode: 'fly' });
  });

  it('rejects unknown movement modes and empty lists without a write', async () => {
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ movementModes: ['hover'] }),
      /Movement Modes must be ground, fly, climb or swim/
    );
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ movementModes: [] }),
      /Movement Modes must be ground, fly, climb or swim/
    );
    let called = false;
    await assert.rejects(
      () =>
        executeMcpTool(
          'update_monster_subtype',
          { typeId: 'type-1', subtypeId: 'sub-1', movementModes: ['teleport'] },
          {
            fetchRpgAdmin: async () => {
              called = true;
              return {};
            },
          }
        ),
      /Movement Modes must be ground, fly, climb or swim/
    );
    assert.equal(called, false);
  });

  it('rejects a primary mode outside the list', () => {
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ movementModes: ['ground'], primaryMovementMode: 'fly' }),
      /Primary Movement Mode must be one of movementModes/
    );
  });

  it('omits movement modes on create when absent so the server assigns them', () => {
    const payload = buildMonsterSubtypeCreatePayload({ name: 'Reef Ray', visualDescription: 'A flat ray.' });
    assert.equal('movementModes' in payload, false);
    assert.equal('primaryMovementMode' in payload, false);

    const handSet = buildMonsterSubtypeCreatePayload({
      name: 'Reef Ray',
      visualDescription: 'A flat ray.',
      movementModes: ['swim'],
    });
    assert.deepEqual(handSet.movementModes, ['swim']);
  });

  it('update sends only the changed movement modes', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'update_monster_subtype',
      { typeId: 'type-1', subtypeId: 'sub-9', movementModes: ['fly'] },
      {
        fetchRpgAdmin: async (path, init) => {
          calls.push({ path, init });
          return { subtype: { id: 'sub-9' } };
        },
      }
    );
    assert.equal(calls[0].path, '/api/admin/monster-types/type-1/subtypes/sub-9');
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { movementModes: ['fly'] });
  });

  it('requires the monsters scope and audits a movement-mode write', async () => {
    let called = false;
    await assert.rejects(
      () =>
        executeMcpTool(
          'update_monster_subtype',
          { typeId: 'type-1', subtypeId: 'sub-9', movementModes: ['swim', 'fly'], primaryMovementMode: 'swim' },
          {
            principal: { name: 'reader', scopes: ['read'] },
            fetchRpgAdmin: async () => {
              called = true;
              return {};
            },
          }
        ),
      /Missing Scope: monsters/
    );
    assert.equal(called, false);

    const events: McpAuditEvent[] = [];
    await executeMcpTool(
      'update_monster_subtype',
      { typeId: 'type-1', subtypeId: 'sub-9', movementModes: ['swim', 'fly'], primaryMovementMode: 'swim' },
      {
        principal: { name: 'bestiary', scopes: ['monsters'] },
        now: () => Date.parse('2026-10-15T13:00:00.000Z'),
        recordAudit: async (event) => {
          events.push(event);
        },
        fetchRpgAdmin: async () => ({ id: 'sub-9' }),
      }
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].keyName, 'bestiary');
    assert.equal(events[0].tool, 'update_monster_subtype');
    assert.equal(events[0].targetId, 'sub-9');
    assert.match(events[0].diffSummary, /fields=movementModes,primaryMovementMode/);
    assert.equal(events[0].createdAt, '2026-10-15T13:00:00.000Z');
  });
});

describe('MCP ship tools', () => {
  const windSkiff = {
    id: 'ship-1',
    name: 'Wind Skiff',
    visualDescription: 'A nimble single-mast skyboat.',
    size: 'Large',
    archetype: 'Aerial',
    allowedTerrains: ['Airborne', 'Mountain', 'Plains', 'Forest', 'Coastal'],
    genres: ['Fantasy'],
    enabled: true,
    encounterExcluded: true,
    rideable: false,
    acquisition: {
      allyKind: 'ship',
      template: 'Tank',
      combatMode: 'automatic',
      progressionMode: 'fixed',
      fixedCr: 3,
      price: 500,
      levelsWithParty: false,
    },
    shipDetails: { crewClass: 'small', spaceCapable: false, imagePrompt: 'Looks like a skiff.' },
  };
  const blockadeBreaker = {
    ...windSkiff,
    id: 'ship-2',
    name: 'Blockade Breaker',
    genres: ['Sci-Fi'],
    shipDetails: { crewClass: 'large', spaceCapable: true },
  };
  const catalog = {
    types: [
      { id: 'type-beast', name: 'Beast', genres: ['Fantasy'], subtypes: [] },
      { id: 'type-ship', name: 'Ship', genres: ['Fantasy', 'Modern', 'Sci-Fi'], subtypes: [windSkiff, blockadeBreaker] },
    ],
  };

  const recordingFetch = (calls: { path: string; init?: RequestInit }[], data: unknown = catalog) =>
    async (path: string, init?: RequestInit) => {
      calls.push({ path, init });
      return init?.method ? { id: 'ship-new' } : data;
    };

  it('lists ships flattened from the Ship type with a genre filter', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    const output = (await executeMcpTool('list_ships', { genre: 'Sci-Fi' }, { fetchRpgAdmin: recordingFetch(calls) })) as {
      typeId: string;
      ships: Record<string, unknown>[];
    };
    assert.deepEqual(calls.map((c) => c.path), ['/api/admin/monster-types?includeSubtypes=1']);
    assert.equal(output.typeId, 'type-ship');
    assert.equal(output.ships.length, 1);
    assert.equal(output.ships[0].name, 'Blockade Breaker');
    assert.equal(output.ships[0].crewClass, 'large');
    assert.equal(output.ships[0].spaceCapable, true);
    assert.equal(output.ships[0].fixedCr, 3);
  });

  it('create_ship posts a full ship subtype under the Ship type', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'create_ship',
      {
        name: 'Ember Corsair',
        visualDescription: 'A red-sailed raider.',
        genre: 'Fantasy',
        fixedCr: 4,
        price: 950,
        template: 'Skirmisher',
        crewClass: 'medium',
        spaceCapable: true,
      },
      { fetchRpgAdmin: recordingFetch(calls) }
    );
    assert.equal(calls[1].path, '/api/admin/monster-types/type-ship/subtypes');
    assert.equal(calls[1].init?.method, 'POST');
    const body = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(body.genres, ['Fantasy']);
    assert.deepEqual(body.movementModes, ['fly']);
    assert.equal(body.primaryMovementMode, 'fly');
    assert.equal(body.encounterExcluded, true);
    assert.equal(body.rideable, false);
    assert.equal(body.archetype, 'Aerial');
    assert.deepEqual(body.allowedTerrains, ['Orbital', 'Deep Space', 'Airborne', 'Warp Rift']);
    assert.deepEqual(body.acquisition, {
      allyKind: 'ship',
      template: 'Skirmisher',
      combatMode: 'automatic',
      progressionMode: 'fixed',
      fixedCr: 4,
      price: 950,
      levelsWithParty: false,
    });
    assert.deepEqual(body.shipDetails, { crewClass: 'medium', spaceCapable: true });
  });

  it('create_ship requires genre, fixedCr, and price', async () => {
    await assert.rejects(
      () =>
        executeMcpTool(
          'create_ship',
          { name: 'Ember Corsair', visualDescription: 'Raider.', fixedCr: 4, price: 950 },
          { fetchRpgAdmin: recordingFetch([]) }
        ),
      /Genre Is Required/
    );
    await assert.rejects(
      () =>
        executeMcpTool(
          'create_ship',
          { name: 'Ember Corsair', visualDescription: 'Raider.', genre: 'Fantasy', price: 950 },
          { fetchRpgAdmin: recordingFetch([]) }
        ),
      /Fixed CR Is Required/
    );
  });

  it('update_ship merges acquisition and shipDetails over the current hull', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool(
      'update_ship',
      { subtypeId: 'ship-1', price: 650, crewClass: 'medium' },
      { fetchRpgAdmin: recordingFetch(calls) }
    );
    assert.equal(calls[1].path, '/api/admin/monster-types/type-ship/subtypes/ship-1');
    assert.equal(calls[1].init?.method, 'PATCH');
    const body = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(body.acquisition, { ...windSkiff.acquisition, price: 650 });
    assert.deepEqual(body.shipDetails, { crewClass: 'medium', spaceCapable: false, imagePrompt: 'Looks like a skiff.' });
    assert.equal(body.allowedTerrains, undefined);
  });

  it('update_ship swaps terrains when spaceCapable changes and rejects unknown hulls', async () => {
    const calls: { path: string; init?: RequestInit }[] = [];
    await executeMcpTool('update_ship', { subtypeId: 'ship-1', spaceCapable: true }, { fetchRpgAdmin: recordingFetch(calls) });
    const body = JSON.parse(String(calls[1].init?.body));
    assert.deepEqual(body.allowedTerrains, ['Orbital', 'Deep Space', 'Airborne', 'Warp Rift']);
    assert.equal(body.acquisition, undefined);

    await assert.rejects(
      () => executeMcpTool('update_ship', { subtypeId: 'nope', price: 10 }, { fetchRpgAdmin: recordingFetch([]) }),
      /Was Not Found Under The Ship Type/
    );
  });

  it('errors clearly when the Ship type is missing', async () => {
    await assert.rejects(
      () => executeMcpTool('list_ships', {}, { fetchRpgAdmin: recordingFetch([], { types: [catalog.types[0]] }) }),
      /Ship Monster Type Was Not Found/
    );
  });

  it('generic subtype tools validate acquisition and shipDetails', () => {
    const payload = buildMonsterSubtypeUpdatePayload({
      acquisition: windSkiff.acquisition,
      shipDetails: { crewClass: 'small', spaceCapable: false },
    });
    assert.deepEqual(payload.acquisition, windSkiff.acquisition);
    assert.deepEqual(payload.shipDetails, { crewClass: 'small', spaceCapable: false });
    assert.equal(buildMonsterSubtypeUpdatePayload({ acquisition: null }).acquisition, null);
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ acquisition: { ...windSkiff.acquisition, allyKind: 'boat' } }),
      /allyKind must be one of/
    );
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ shipDetails: { crewClass: 'huge', spaceCapable: false } }),
      /crewClass must be one of/
    );
    assert.throws(
      () => buildMonsterSubtypeUpdatePayload({ shipDetails: { crewClass: 'small', spaceCapable: false, hp: 9 } }),
      /Unknown Ship Details Keys: hp/
    );
  });

  it('ship writes need the monsters scope and are audited', async () => {
    await assert.rejects(
      () =>
        executeMcpTool('create_ship', {}, {
          principal: { name: 'reader', scopes: ['read'] },
          fetchRpgAdmin: recordingFetch([]),
        }),
      /Missing Scope: monsters/
    );
    const events: McpAuditEvent[] = [];
    await executeMcpTool(
      'update_ship',
      { subtypeId: 'ship-1', price: 700 },
      {
        principal: { name: 'bestiary', scopes: ['monsters'] },
        recordAudit: async (event) => {
          events.push(event);
        },
        fetchRpgAdmin: recordingFetch([]),
      }
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].tool, 'update_ship');
    assert.equal(events[0].targetId, 'ship-1');
    assert.match(events[0].diffSummary, /fields=price/);
  });
});
