export function isSafeHttpUrl(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^\/\//.test(trimmed) || /[\s\\]/.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

export function safeHttpUrlOrNull(value: string | null | undefined): string | null {
  if (!isSafeHttpUrl(value)) return null;
  return value!.trim();
}
