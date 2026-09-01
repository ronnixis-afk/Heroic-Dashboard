import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAuthorizedMcpRequest } from './lib/mcpAuth';
import { dispatchMcpMessage } from './lib/mcpProtocol';
import { DEFAULT_MCP_PROTOCOL_VERSION } from './lib/mcpTools';

export const config = {
  maxDuration: 30,
};

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

function sendJson(response: VercelResponse, status: number, payload: unknown) {
  return response.status(status).json(payload);
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

export default async function handler(request: VercelRequest, response: VercelResponse) {
  applyCors(response);

  if (request.method === 'OPTIONS') {
    return response.status(204).end();
  }

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
