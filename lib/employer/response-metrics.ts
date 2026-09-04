import { prisma } from "@/lib/prisma";
import { ROLLUP_BATCH_SIZE } from "@/lib/employer/analytics-rollups";
import { invalidatePublicCompany } from "@/lib/public-companies";

/**
 * PUBLIC "RESPONSE RATE / MEDIAN RESPONSE TIME" METRICS — Phase 4.3.
 * ====================================================================
 * The signal this is built on is `Application.firstEmployerResponseAt` (see
 * its schema comment): stamped once, the first time an employer engages with
 * a candidate, at exactly three sites — lib/jobs/applications.ts's
 * updateApplication, lib/collaborative-hiring-reviews.ts's
 * updateCollaborativePipeline, and lib/messaging/messages.ts's sendMessage.
 *
 * This file owns:
 *  - `computeResponseMetrics` — the pure, unit-testable rules (see
 *    response-metrics.test.ts)
 *  - `recomputeCompanyResponseMetrics` — the Prisma-backed read + write for
 *    one company
 *  - `runResponseMetricsForAllCompanies` — the nightly batch job, wired into
 *    the existing analytics-rollups cron
 */

export type ResponseMetricsSample = {
  appliedAt: Date;
  firstEmployerResponseAt: Date | null;
};

export type ResponseMetricsResult = {
  responseRate: number | null;
  medianResponseMinutes: number | null;
  sampleSize: number;
};

/** Rolling window: only applications submitted in the last 90 days count toward the published numbers. */
export const RESPONSE_METRICS_WINDOW_DAYS = 90;
const WINDOW_MS = RESPONSE_METRICS_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Grace period: an application younger than 7 days with no response yet is
 * not ghosted, just recent — it is excluded from the qualifying set entirely
 * (it counts toward neither the numerator nor the denominator). A young
 * application that WAS answered still counts — answering fast is itself
 * evidence of speed, and excluding it would bias the rate toward slower
 * companies that happen to sit on applications past the grace window before
 * responding.
 */
export const RESPONSE_METRICS_GRACE_DAYS = 7;
const GRACE_MS = RESPONSE_METRICS_GRACE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Minimum sample: fewer than this many qualifying applications and the rate
 * / median are never published (both come back null) — only `sampleSize` is
 * returned, so the UI can be honest about thin data ("not enough applicants
 * yet") instead of showing a number derived from one or two applications
 * that could trivially be gamed or is simply not statistically meaningful.
 */
export const RESPONSE_METRICS_MIN_SAMPLE = 5;

function median(sortedMinutes: number[]): number {
  const n = sortedMinutes.length;
  const mid = Math.floor(n / 2);
  const value = n % 2 === 0 ? (sortedMinutes[mid - 1] + sortedMinutes[mid]) / 2 : sortedMinutes[mid];
  return Math.round(value);
}

/**
 * Pure — no Prisma import, fully unit-testable. See response-metrics.test.ts
 * for the exact cases this must satisfy (grace period, window, sample
 * minimum, median on odd/even counts, rounding).
 */
export function computeResponseMetrics(
  samples: ResponseMetricsSample[],
  opts?: { now?: Date }
): ResponseMetricsResult {
  const now = opts?.now ?? new Date();
  const windowStart = now.getTime() - WINDOW_MS;
  const graceCutoff = now.getTime() - GRACE_MS;

  const qualifying = samples.filter((sample) => {
    if (sample.appliedAt.getTime() < windowStart) return false;
    // Exclude a young, still-unanswered application — it isn't evidence of
    // ghosting yet. A young *answered* application is kept (see the
    // RESPONSE_METRICS_GRACE_DAYS doc comment above).
    if (!sample.firstEmployerResponseAt && sample.appliedAt.getTime() > graceCutoff) return false;
    return true;
  });

  const sampleSize = qualifying.length;
  if (sampleSize < RESPONSE_METRICS_MIN_SAMPLE) {
    return { responseRate: null, medianResponseMinutes: null, sampleSize };
  }

  const responseMinutes = qualifying
    .filter((sample): sample is ResponseMetricsSample & { firstEmployerResponseAt: Date } =>
      sample.firstEmployerResponseAt !== null
    )
    .map((sample) => (sample.firstEmployerResponseAt.getTime() - sample.appliedAt.getTime()) / 60000)
    .sort((a, b) => a - b);

  const responseRate = Math.round((responseMinutes.length / sampleSize) * 100);
  const medianResponseMinutes = responseMinutes.length > 0 ? median(responseMinutes) : null;

  return { responseRate, medianResponseMinutes, sampleSize };
}

/** Loads one company's rolling-window applications, computes, and persists the four denormalized fields. */
export async function recomputeCompanyResponseMetrics(companyId: string): Promise<ResponseMetricsResult> {
  const windowStart = new Date(Date.now() - WINDOW_MS);

  const jobs = await prisma.job.findMany({ where: { companyId }, select: { id: true } });
  const jobIds = jobs.map((job) => job.id);

  const samples: ResponseMetricsSample[] = jobIds.length
    ? await prisma.application.findMany({
        where: { jobId: { in: jobIds }, appliedAt: { gte: windowStart } },
        select: { appliedAt: true, firstEmployerResponseAt: true },
      })
    : [];

  const result = computeResponseMetrics(samples);

  await prisma.company.update({
    where: { id: companyId },
    data: {
      responseRate: result.responseRate,
      medianResponseMinutes: result.medianResponseMinutes,
      responseSampleSize: result.sampleSize,
      responseMetricsUpdatedAt: new Date(),
    },
  });

  invalidatePublicCompany(companyId);

  return result;
}

/**
 * Runs the nightly recompute for every company with at least one job — same
 * batching shape as runDailyRollupsForAllCompanies (lib/employer/
 * analytics-rollups.ts): reuses ROLLUP_BATCH_SIZE and the
 * `Promise.allSettled` + per-company try/catch pattern rather than inventing
 * a second concurrency scheme. It's a full recompute of a rolling window each
 * night, so no separate backfill job is needed beyond the migration's.
 */
export async function runResponseMetricsForAllCompanies(): Promise<{ companies: number }> {
  const companies = await prisma.company.findMany({
    where: { jobs: { some: {} } },
    select: { id: true },
  });

  for (let i = 0; i < companies.length; i += ROLLUP_BATCH_SIZE) {
    await Promise.allSettled(
      companies.slice(i, i + ROLLUP_BATCH_SIZE).map(async (company) => {
        try {
          await recomputeCompanyResponseMetrics(company.id);
        } catch (error) {
          console.error(`[response-metrics] failed for company ${company.id}:`, error);
        }
      })
    );
  }

  return { companies: companies.length };
}

/**
 * Stamps `Application.firstEmployerResponseAt` from the employer's first
 * message to a seeker (site 3 of 3 — see the schema comment on the column).
 * Conversation is unique on (companyId, seekerId) with an optional jobId, so
 * there is at most one conversation per company+seeker pair:
 *  - when it's scoped to a job, that unambiguously identifies which
 *    application the message is about — stamp that seeker's unstamped
 *    application to that exact job.
 *  - when it isn't (a company-wide thread), there is no way to know which of
 *    the seeker's applications at this company the message answers — this is
 *    a deliberate approximation, not a resolvable ambiguity — so we stamp
 *    only the seeker's most recently applied, still-unstamped application at
 *    that company (the best available guess).
 * Uses `updateMany` with a `firstEmployerResponseAt: null` guard so this is
 * safe to call more than once and safe under concurrent calls — never
 * overwrites an existing stamp.
 */
export async function stampFirstEmployerResponseForMessage(args: {
  companyId: string;
  seekerId: string;
  jobId: string | null;
}): Promise<void> {
  const { companyId, seekerId, jobId } = args;
  const now = new Date();

  if (jobId) {
    await prisma.application.updateMany({
      where: { jobId, seekerId, firstEmployerResponseAt: null },
      data: { firstEmployerResponseAt: now },
    });
    return;
  }

  const candidate = await prisma.application.findFirst({
    where: { seekerId, firstEmployerResponseAt: null, job: { companyId } },
    orderBy: { appliedAt: "desc" },
    select: { id: true },
  });
  if (!candidate) return;

  await prisma.application.updateMany({
    where: { id: candidate.id, firstEmployerResponseAt: null },
    data: { firstEmployerResponseAt: now },
  });
}

/**
 * Pure — the stamp-once decision shared by the two status-transition sites
 * (lib/jobs/applications.ts's updateApplication and
 * lib/collaborative-hiring-reviews.ts's updateCollaborativePipeline): an
 * application counts as having received its first employer response when the
 * status transition moves it *off* APPLIED (any of SHORTLISTED, INTERVIEW,
 * REJECTED, or HIRED — a rejection is still an employer engagement, just not
 * a positive one) and it has never been stamped before.
 */
export function isFirstEmployerResponseTransition(
  previousStatus: string,
  nextStatus: string | undefined,
  alreadyStamped: boolean
): boolean {
  return (
    nextStatus !== undefined && nextStatus !== "APPLIED" && previousStatus === "APPLIED" && !alreadyStamped
  );
}
