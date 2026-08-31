/** Canonical normalization for email addresses used at every write and lookup. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
