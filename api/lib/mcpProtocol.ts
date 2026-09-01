import { executeMcpTool, MCP_SERVER_INFO, MCP_TOOLS, negotiateProtocolVersion } from './mcpTools';
import type { McpToolRuntime } from './mcpTools';

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
            'Use get_insights for live game analytics, list_patch_notes to read published notes newest-first, and publish_patch_note to create a published News row with is_patch_note true. Do not set is_popup.',
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
