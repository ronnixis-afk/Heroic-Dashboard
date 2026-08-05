import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLERK_FRONTEND_API = 'https://frontend-api.clerk.dev';
const PROXY_PATH = '/api/clerk-proxy';
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

type RateEntry = { count: number; resetAt: number };
const rateLimitByIp = new Map<string, RateEntry>();

function clientIp(request: VercelRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return request.socket.remoteAddress || 'unknown';
}

function allowRequest(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitByIp.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function proxyUrl(request: VercelRequest): string {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  return `${protocol}://${host}${PROXY_PATH}`;
}

function resolveProxyPath(request: VercelRequest): string | null {
  const rawPath = request.query.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath || '';
  const normalized = path.replace(/^\/+/, '');
  // Only Clerk Frontend API v1 paths are allowed through the proxy.
  if (!normalized.startsWith('v1/')) return null;
  return normalized;
}

function upstreamUrl(request: VercelRequest, path: string): URL {
  const target = new URL(`/${path}`, CLERK_FRONTEND_API);

  for (const [name, value] of Object.entries(request.query)) {
    if (name === 'path' || value == null) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      target.searchParams.append(name, item);
    }
  }

  return target;
}

async function requestBody(request: VercelRequest): Promise<Buffer | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  if (Buffer.isBuffer(request.body)) return request.body;
  if (typeof request.body === 'string') return Buffer.from(request.body);
  if (request.body != null) return Buffer.from(JSON.stringify(request.body));

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return response.status(500).json({ error: 'Clerk Proxy Is Not Configured.' });
  }

  const ip = clientIp(request);
  if (!allowRequest(ip)) {
    return response.status(429).json({ error: 'Too Many Requests. Please Try Again Shortly.' });
  }

  const path = resolveProxyPath(request);
  if (!path) {
    return response.status(400).json({ error: 'Invalid Proxy Path. Only /v1/ Paths Are Allowed.' });
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (!value) continue;
    const lower = name.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }

  headers.set('Clerk-Proxy-Url', proxyUrl(request));
  headers.set('Clerk-Secret-Key', secretKey);
  headers.set('X-Forwarded-For', ip);

  try {
    const upstream = await fetch(upstreamUrl(request, path), {
      method: request.method,
      headers,
      body: await requestBody(request),
      redirect: 'manual',
    });

    response.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      if (['content-encoding', 'content-length', 'set-cookie', 'transfer-encoding'].includes(name)) {
        return;
      }
      response.setHeader(name, value);
    });

    const getSetCookie = (
      upstream.headers as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie;
    const cookies = getSetCookie?.call(upstream.headers) || [];
    if (cookies.length > 0) response.setHeader('Set-Cookie', cookies);

    return response.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.error('[Clerk Proxy] Upstream request failed:', error);
    return response.status(502).json({ error: 'Clerk Proxy Request Failed.' });
  }
}
