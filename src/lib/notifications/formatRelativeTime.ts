export function formatRelativeNotificationTime(iso: string): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return 'Unknown';

  const diffMs = Date.now() - created;
  if (diffMs < 45_000) return 'Just Now';

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m Ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h Ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d Ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
