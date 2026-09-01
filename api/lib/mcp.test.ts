import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { formatAnalyticsOverview } from '../../src/lib/analyticsInsights';
import handler from '../mcp';
import { extractBearerToken, isAuthorizedMcpRequest } from './mcpAuth';
import { buildPatchNotePayload, sortPatchNotesNewestFirst } from './mcpPatchNotes';
import { dispatchMcpMessage } from './mcpProtocol';
import { MCP_TOOLS, executeMcpTool } from './mcpTools';

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
      mockRequest({ headers: { authorization: `Bearer ${KEY}` }, body: { jsonrpc: '2.0', id: 1, method: 'ping' } }),
      res.response
    );
    assert.equal(res.state.statusCode, 500);
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
    assert.deepEqual(sorted.map((item) => item.id), ['new', 'mid', 'old']);
  });
});

describe('MCP JSON-RPC tools', () => {
  it('lists exactly the three v1 tools', async () => {
    assert.deepEqual(
      MCP_TOOLS.map((tool) => tool.name),
      ['get_insights', 'publish_patch_note', 'list_patch_notes']
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
      ['get_insights', 'publish_patch_note', 'list_patch_notes']
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
    });

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
      ['get_insights', 'publish_patch_note', 'list_patch_notes']
    );
  });
});
