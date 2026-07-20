import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLERK_FRONTEND_API = 'https://frontend-api.clerk.dev';
const PROXY_PATH = '/api/clerk-proxy';

function proxyUrl(request: VercelRequest): string {
  const protocol = request.headers['x-forwarded-proto'] || 'https';
  const host = request.headers['x-forwarded-host'] || request.headers.host;
  return `${protocol}://${host}${PROXY_PATH}`;
}

function upstreamUrl(request: VercelRequest): URL {
  const rawPath = request.query.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : rawPath || '';
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

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (!value || name.toLowerCase() === 'content-length') continue;
    headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }

  headers.set('Clerk-Proxy-Url', proxyUrl(request));
  headers.set('Clerk-Secret-Key', secretKey);
  headers.set(
    'X-Forwarded-For',
    String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || '')
  );

  try {
    const upstream = await fetch(upstreamUrl(request), {
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
