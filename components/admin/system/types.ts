/**
 * Client-side (serialized) wire shapes for `/admin/system` — mirrors
 * `SystemHealthReport` and its constituent types from
 * `lib/admin/system-health.ts` / `lib/admin/cron-runs.ts` verbatim, field for
 * field, except every `Date` becomes an ISO string (the page's
 * `JSON.parse(JSON.stringify(...))` round-trip does that conversion, same
 * convention as `components/admin/team/types.ts` and the team page's own
 * serialization). Nothing here recomputes anything the backend already
 * decided — in particular the `SerializedSystemHealthMetric<T>` discriminated
 * union is transcribed exactly, so a "not_instrumented" value physically
 * cannot be rendered as a `T` by a component that destructures it correctly.
 */

export type SerializedSystemHealthMetric<T> = { status: "ok"; value: T } | { status: "not_instrumented"; reason: string };

export type SerializedCronRunSummary = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  error: string | null;
};

export type SerializedCronHealthEntry = {
  jobName: string;
  lastRun: SerializedCronRunSummary | null;
  lastSuccessAt: string | null;
  lastSuccessAgeHours: number | null;
  currentStatus: "NEVER_RUN" | "RUNNING" | "SUCCESS" | "FAILED";
};

export type SerializedDatabaseHealth = { status: "ok"; latencyMs: number } | { status: "error"; error: string };

export type SerializedSystemRowCounts = {
  users: number;
  companies: number;
  jobs: number;
  applications: number;
  featureFlags: number;
};

export type SerializedSystemHealthReport = {
  generatedAt: string;
  cron: SerializedCronHealthEntry[];
  database: SerializedDatabaseHealth;
  redis: { configured: boolean };
  appUrl: { isFallback: boolean };
  rowCounts: SerializedSystemRowCounts;
  errorRate: SerializedSystemHealthMetric<number>;
  p95LatencyJobsMs: SerializedSystemHealthMetric<number>;
  p95LatencySeekerDashboardMs: SerializedSystemHealthMetric<number>;
  dbConnectionCount: SerializedSystemHealthMetric<number>;
  emailDeliveryRate: SerializedSystemHealthMetric<number>;
  emailBounceRate: SerializedSystemHealthMetric<number>;
  paymentWebhookSuccessRate: SerializedSystemHealthMetric<number>;
  alertThresholds: {
    dbCpuSustainedPercent: number;
    poolerClientCount: number;
    realtimeConnectionCount: number;
  };
};
