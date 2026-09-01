/**
 * Server-side Heroic AI RPG API helper.
 * Uses ADMIN_API_KEY (Bearer and x-admin-key) instead of a Clerk session token.
 */
export function getRpgApiUrl(): string {
  return (process.env.RPG_API_URL || process.env.VITE_RPG_API_URL || '').replace(/\/$/, '');
}

export function getAdminApiKey(): string {
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

export async function fetchRpgAdminServer<T>(path: string, init?: RequestInit): Promise<T> {
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

export async function fetchRpgPublic<T>(path: string, init?: RequestInit): Promise<T> {
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
