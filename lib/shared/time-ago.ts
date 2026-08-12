export function daysUntil(date: string | Date): number {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = target.getTime() - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function isClosingSoon(expiresAt: string | Date | null | undefined): boolean {
  if (!expiresAt) return false;
  const days = daysUntil(expiresAt);
  return days >= 0 && days <= 5;
}

export function closingLabel(expiresAt: string | Date): string {
  const days = daysUntil(expiresAt);
  if (days <= 0) return "Closing today";
  if (days === 1) return "Closing tomorrow";
  return `Closing in ${days}d`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function timeAgo(iso: string): string {
  const relative = relativeTime(iso);
  if (!relative) return "";
  return relative === "just now" ? "Just posted" : `Posted ${relative}`;
}
