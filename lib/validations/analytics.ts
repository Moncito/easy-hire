import { z } from "zod";

/** Maximum span (inclusive, in days) allowed for a custom analytics date range. */
export const MAX_ANALYTICS_RANGE_DAYS = 366;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Validates the `from`/`to` query params accepted by
 * GET /api/employer/analytics. Coerces to `Date`, rejects invalid dates,
 * rejects `from` after `to`, and clamps the maximum span so a caller can't
 * request an unbounded rollup window.
 */
export const analyticsDateRangeSchema = z
  .object({
    from: z.coerce.date("Invalid from/to date"),
    to: z.coerce.date("Invalid from/to date"),
  })
  .refine((d) => d.from <= d.to, {
    message: "from must not be after to",
    path: ["to"],
  })
  .refine((d) => (d.to.getTime() - d.from.getTime()) / MS_PER_DAY <= MAX_ANALYTICS_RANGE_DAYS, {
    message: `Date range cannot exceed ${MAX_ANALYTICS_RANGE_DAYS} days`,
    path: ["to"],
  });

export type AnalyticsDateRange = z.infer<typeof analyticsDateRangeSchema>;
