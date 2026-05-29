/**
 * Authenticated fetch helper for Heroic AI RPG admin API routes.
 * Uses the standard Clerk session token (not the Supabase JWT template).
 */
export async function fetchRpgAdmin<T>(
  path: string,
  getToken: (options?: { template?: string }) => Promise<string | null>
): Promise<T> {
  const apiUrl = import.meta.env.VITE_RPG_API_URL;
  if (!apiUrl) {
    throw new Error('VITE_RPG_API_URL is not configured.');
  }

  const token = await getToken();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${apiUrl}${normalizedPath}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Server returned status ${response.status}`);
  }

  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }

  return data as T;
}
