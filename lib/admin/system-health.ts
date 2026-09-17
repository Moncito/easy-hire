import { prisma } from "@/lib/prisma";
import { isRedisConfigured } from "@/lib/redis";
import { IS_FALLBACK_APP_URL } from "@/lib/shared/app-url";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getCronHealth, type CronHealthEntry } from "@/lib/admin/cron-runs";

/**
 * `/admin/system` health screen — docs/ADMIN-CONSOLE-PLAN.md §4.10, scope
 * approved in docs/build-plan.md's Sprint 11 entry ("Health-screen scope
 * (approved)"). Gated on `system.read` at the /lib layer, same as
 * `listFeatureFlags` in lib/admin/feature-flags.ts.
 * ============================================================================
 * SCOPE DISCIPLINE — this is the load-bearing rule of this module, and it is
 * already decided, not a judgment call for this file to relitigate. §4.10
 * lists eight things a health screen "should" show. Four are backed by data
 * this app actually has (cron health, DB reachability/latency, Redis
 * configuration, `APP_URL` fallback state) and this module computes them for
 * real. The other four — error rate, p95 latency on `/jobs` and
 * `/seeker/dashboard`, DB connection/pooler-client count, email
 * delivery/bounce rate, and payment-webhook success rate — are Vercel /
 * Supabase / Resend DASHBOARD metrics with literally no local source (this
 * app has no request-timing middleware, no Postgres pg_stat_activity query
 * path wired up, and no email webhook receiver), and the payment one is
 * Phase 6 (no payment integration exists yet at all).
 *
 * `SystemHealthMetric<T>` is a discriminated union for exactly this reason —
 * `{ status: "ok"; value }` or `{ status: "not_instrumented"; reason }` —
 * so the UI PHYSICALLY CANNOT render a fabricated number for one of the four
 * uninstrumented metrics. This mirrors `queueDepths` in lib/admin/rollups.ts
 * returning `null` for dates it cannot honestly describe rather than a
 * plausible-looking zero: an invented "0% error rate" or "45ms p95" would
 * look real and would be actively worse than an explicit "not instrumented"
 * state, which is at least honest about what this app does and doesn't know
 * about itself.
 */

// ============================================================================
// Alert thresholds — docs/ADMIN-CONSOLE-PLAN.md §4.10's own text: "Alert
// thresholds from the scalability doc: DB CPU over 70% sustained, pooler
// clients over 150, Realtime connections over 150." Surfaced here as
// constants, in ONE place, even though the corresponding metrics
// (`dbConnectionCount` etc.) are not instrumented yet — so the thresholds
// live in code, ready for the day a real metric feeds them, rather than only
// existing as a sentence in a planning doc that can drift from what the UI
// actually checks against.
// ============================================================================

export const SYSTEM_HEALTH_ALERT_THRESHOLDS = {
  /** DB CPU sustained above this percentage is an alert condition. Not instrumented locally (Supabase dashboard metric) — see `dbConnectionCount`'s doc comment. */
  dbCpuSustainedPercent: 70,
  /** Supabase connection-pooler client count above this is an alert condition. */
  poolerClientCount: 150,
  /** Supabase Realtime connection count above this is an alert condition. */
  realtimeConnectionCount: 150,
} as const;

// ============================================================================
// The discriminated-union metric shape.
// ============================================================================

export type SystemHealthMetric<T> = { status: "ok"; value: T } | { status: "not_instrumented"; reason: string };

/**
 * Exported so callers/tests can construct the same shape the real metrics
 * use, without hand-rolling the literal object at every call site. Every
 * "not instrumented" metric on `SystemHealthReport` below is built with this
 * — none of them fabricate a `{ status: "ok", value: 0 }` in its place.
 */
export function notInstrumented(reason: string): SystemHealthMetric<never> {
  return { status: "not_instrumented", reason };
}

// ============================================================================
// Database reachability + round-trip latency — a trivial `SELECT 1`, timed.
// ============================================================================

export type DatabaseHealth = { status: "ok"; latencyMs: number } | { status: "error"; error: string };

async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : "Unknown database error" };
  }
}

// ============================================================================
// Cheap row counts — plain `count()` aggregates, batched in one
// `Promise.all`, never a query per table sequentially. "Storage-ish" in the
// sense §4.10 means it (a proxy for platform size), not an actual
// bytes-on-disk figure — Supabase Storage usage itself is a dashboard metric
// with no Prisma-queryable source, same category as the four
// not-instrumented metrics below.
// ============================================================================

export type SystemRowCounts = {
  users: number;
  companies: number;
  jobs: number;
  applications: number;
  featureFlags: number;
};

async function getRowCounts(): Promise<SystemRowCounts> {
  const [users, companies, jobs, applications, featureFlags] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.job.count(),
    prisma.application.count(),
    prisma.featureFlag.count(),
  ]);
  return { users, companies, jobs, applications, featureFlags };
}

// ============================================================================
// Full report.
// ============================================================================

export type SystemHealthReport = {
  generatedAt: Date;
  cron: CronHealthEntry[];
  database: DatabaseHealth;
  redis: { configured: boolean };
  appUrl: { isFallback: boolean };
  rowCounts: SystemRowCounts;
  /** Vercel Analytics metric — no local request-timing/error-tracking source exists in this app. */
  errorRate: SystemHealthMetric<number>;
  /** Vercel Analytics metric — no local request-timing source exists for `/jobs`. */
  p95LatencyJobsMs: SystemHealthMetric<number>;
  /** Vercel Analytics metric — no local request-timing source exists for `/seeker/dashboard`. */
  p95LatencySeekerDashboardMs: SystemHealthMetric<number>;
  /** Supabase dashboard metric (pooler clients / `pg_stat_activity`) — no local source; compare against `SYSTEM_HEALTH_ALERT_THRESHOLDS.poolerClientCount` once it is. */
  dbConnectionCount: SystemHealthMetric<number>;
  /** Resend dashboard metric — no local delivery-webhook receiver exists. */
  emailDeliveryRate: SystemHealthMetric<number>;
  /** Resend dashboard metric — no local bounce-webhook receiver exists. */
  emailBounceRate: SystemHealthMetric<number>;
  /** Phase 6 — no payment provider is integrated yet (docs/build-plan.md), so there are no webhooks to measure. */
  paymentWebhookSuccessRate: SystemHealthMetric<number>;
  alertThresholds: typeof SYSTEM_HEALTH_ALERT_THRESHOLDS;
};

export async function getSystemHealth(adminUserId: string): Promise<SystemHealthReport> {
  await requireAdminPermission(adminUserId, "system.read");

  const [cron, database, rowCounts] = await Promise.all([getCronHealth(), checkDatabaseHealth(), getRowCounts()]);

  return {
    generatedAt: new Date(),
    cron,
    database,
    redis: { configured: isRedisConfigured },
    appUrl: { isFallback: IS_FALLBACK_APP_URL },
    rowCounts,
    errorRate: notInstrumented("Request error rate is a Vercel Analytics dashboard metric — no local request-tracking source exists in this app."),
    p95LatencyJobsMs: notInstrumented("p95 latency for /jobs is a Vercel Analytics dashboard metric — no local request-timing source exists."),
    p95LatencySeekerDashboardMs: notInstrumented(
      "p95 latency for /seeker/dashboard is a Vercel Analytics dashboard metric — no local request-timing source exists."
    ),
    dbConnectionCount: notInstrumented(
      "Live Postgres connection / pooler-client count is a Supabase dashboard metric — no local source exists. Alert threshold: pooler clients > " +
        SYSTEM_HEALTH_ALERT_THRESHOLDS.poolerClientCount +
        "."
    ),
    emailDeliveryRate: notInstrumented("Email delivery rate is a Resend dashboard metric — no local delivery-webhook receiver exists."),
    emailBounceRate: notInstrumented("Email bounce rate is a Resend dashboard metric — no local bounce-webhook receiver exists."),
    paymentWebhookSuccessRate: notInstrumented("Payments are Phase 6 (docs/build-plan.md) — no payment provider is integrated yet, so there are no webhooks to measure."),
    alertThresholds: SYSTEM_HEALTH_ALERT_THRESHOLDS,
  };
}
