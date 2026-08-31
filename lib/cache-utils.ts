/**
 * unstable_cache round-trips its return value through JSON, which turns every
 * Date into a plain string. Callers that still expect real Date objects (e.g.
 * `row.updatedAt.toISOString()`) throw once the value comes from the cache.
 * Wrap a cached read's result in this to convert ISO-8601 strings back into
 * Dates before handing it to code that was written against the uncached shape.
 */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export function reviveDates<T>(value: T): T {
  // MUST come before the object branch. `typeof new Date() === "object"`, and a
  // Date has no own enumerable properties, so falling through to
  // `Object.entries` below rebuilds it as `{}` — silently destroying every
  // real Date on a cache *miss*, where the value comes straight from Prisma
  // and was never serialized. That is the inverse of the bug this helper
  // exists to fix, and it is why `app.appliedAt.toISOString()` threw on the
  // seeker dashboard's first (uncached) render. Covered by cache-utils.test.ts.
  if (value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => reviveDates(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = reviveDates(val);
    }
    return out as T;
  }
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    return new Date(value) as unknown as T;
  }
  return value;
}
