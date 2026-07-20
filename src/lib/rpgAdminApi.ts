/**
 * Authenticated fetch helper for Heroic AI RPG admin API routes.
 * Uses the standard Clerk session token (not the Supabase JWT template).
 *
 * Pass a pre-fetched token string to avoid repeated getToken() calls in batched fetches.
 */
export type RpgAdminTokenSource =
  | string
  | ((options?: { template?: string }) => Promise<string | null>);

export async function fetchRpgAdmin<T>(
  path: string,
  tokenOrGetter: RpgAdminTokenSource,
  init?: RequestInit
): Promise<T> {
  const apiUrl = (import.meta.env.VITE_RPG_API_URL || '').replace(/\/$/, '');
  if (!apiUrl) {
    throw new Error('VITE_RPG_API_URL is not configured.');
  }

  const token =
    typeof tokenOrGetter === 'string' ? tokenOrGetter : await tokenOrGetter();
  if (!token) {
    throw new Error('Admin Session Expired. Please Sign In Again.');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  let response: Response;
  try {
    response = await fetch(`${apiUrl}${normalizedPath}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Network error';
    throw new Error(
      `Could not reach RPG API at ${apiUrl} (${detail}). Confirm VITE_RPG_API_URL and that the RPG server is running.`
    );
  }

  const data = await response.json().catch(() => ({}));
  const payload = data as { error?: string; message?: string };

  if (!response.ok) {
    const detail = [payload.error, payload.message].filter(Boolean).join(' — ');
    throw new Error(detail || `Server Returned Status ${response.status}`);
  }

  if (payload.error) {
    throw new Error(payload.error);
  }

  return data as T;
}
