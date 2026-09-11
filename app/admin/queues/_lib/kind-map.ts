import type { QueueKind } from "@/lib/admin/queues";

/**
 * The ONE place the two queue vocabularies meet (task instructions:
 * "Map URL segment -> QueueKind in one place ... Do not introduce a third
 * spelling anywhere"). URL segments are lowercase-plural per
 * docs/ADMIN-CONSOLE-PLAN.md §3; `QueueKind` is the uppercase singular the
 * API/lib use. Both `app/admin/queues/page.tsx` (index, needs kind -> segment
 * for links) and `app/admin/queues/[kind]/page.tsx` (needs segment -> kind)
 * import from here so neither page hand-rolls its own copy of this mapping.
 */
export const QUEUE_KIND_BY_SEGMENT: Record<string, QueueKind> = {
  companies: "COMPANY",
  seekers: "SEEKER",
  jobs: "JOB",
  reviews: "REVIEW",
};

export const QUEUE_SEGMENT_BY_KIND: Record<QueueKind, string> = {
  COMPANY: "companies",
  SEEKER: "seekers",
  JOB: "jobs",
  REVIEW: "reviews",
};

export const QUEUE_KIND_LABEL: Record<QueueKind, string> = {
  COMPANY: "Companies",
  SEEKER: "Seekers",
  JOB: "Jobs",
  REVIEW: "Reviews",
};
