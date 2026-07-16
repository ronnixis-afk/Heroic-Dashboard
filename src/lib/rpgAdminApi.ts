/**
 * Authenticated fetch helper for Heroic AI RPG admin API routes.
 * Uses the standard Clerk session token (not the Supabase JWT template).
 */
export async function fetchRpgAdmin<T>(
  path: string,
  getToken: (options?: { template?: string }) => Promise<string | null>,
  init?: RequestInit
): Promise<T> {
  const apiUrl = (import.meta.env.VITE_RPG_API_URL || '').replace(/\/$/, '');
  if (!apiUrl) {
    throw new Error('VITE_RPG_API_URL is not configured.');
  }

  const token = await getToken();
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

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Server returned status ${response.status}`);
  }

  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }

  return data as T;
}
