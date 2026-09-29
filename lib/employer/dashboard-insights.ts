import { prisma } from "@/lib/prisma";

/**
 * EASY AI INSIGHTS (rules-based)
 * ==============================
 * The teal card at the top of the Pro dashboard. Deliberately not an LLM
 * call yet: each insight is a plain rule over real data, so every sentence
 * is a fact about this account and nothing is invented. At most one of each
 * kind, so the card never holds more than two rows; when no rule fires, the
 * card doesn't render at all.
 */

/** An application waiting longer than this for a first decision gets flagged. */
export const DECISION_TARGET_DAYS = 14;
/** A live listing with no applicants after this long gets flagged. */
export const QUIET_LISTING_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DashboardInsight = {
  id: "stale-application" | "quiet-listing";
  /** Rendered bold. */
  lead: string;
  /** Rendered after `lead` in normal weight; may be empty. */
  rest: string;
  actionLabel: string;
  href: string;
};

export type InsightInputs = {
  oldestApplied: {
    applicationId: string;
    jobId: string;
    seekerName: string;
    jobTitle: string;
    appliedAt: Date;
  } | null;
  quietListing: {
    jobId: string;
    title: string;
    views: number;
  } | null;
};

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function daysBetween(from: Date, now: Date): number {
  return Math.floor((now.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Pure. Turns the two facts into card rows, applying the thresholds. */
export function buildDashboardInsights(input: InsightInputs, now: Date): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (input.oldestApplied) {
    const waited = daysBetween(input.oldestApplied.appliedAt, now);
    if (waited > DECISION_TARGET_DAYS) {
      insights.push({
        id: "stale-application",
        lead: `${input.oldestApplied.seekerName} has waited ${plural(waited, "day")}`,
        rest: ` for a decision on ${input.oldestApplied.jobTitle}.`,
        actionLabel: "Open application",
        href: `/employer/jobs/${input.oldestApplied.jobId}/applicants?application=${input.oldestApplied.applicationId}`,
      });
    }
  }

  if (input.quietListing) {
    insights.push({
      id: "quiet-listing",
      lead: `${input.quietListing.title} has ${plural(input.quietListing.views, "view")} and no applicants.`,
      rest: "",
      actionLabel: "Rewrite listing",
      href: `/employer/jobs/${input.quietListing.jobId}/edit`,
    });
  }

  return insights;
}

/**
 * Loads the two facts the rules need. The quiet-listing query already
 * applies its 7-day rule (and skips expired listings, which can't get
 * applicants anyway), picking the longest-quiet one.
 */
export async function getDashboardInsights(companyId: string, now: Date = new Date()): Promise<DashboardInsight[]> {
  const quietCutoff = new Date(now.getTime() - QUIET_LISTING_DAYS * MS_PER_DAY);

  const [oldest, quietJob] = await Promise.all([
    prisma.application.findFirst({
      where: { status: "APPLIED", job: { companyId } },
      orderBy: { appliedAt: "asc" },
      select: {
        id: true,
        appliedAt: true,
        jobId: true,
        seeker: { select: { fullName: true } },
        job: { select: { title: true } },
      },
    }),
    prisma.job.findFirst({
      where: {
        companyId,
        status: "ACTIVE",
        applications: { none: {} },
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          {
            OR: [
              { publishedAt: { lt: quietCutoff } },
              { publishedAt: null, createdAt: { lt: quietCutoff } },
            ],
          },
        ],
      },
      orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, _count: { select: { views: true } } },
    }),
  ]);

  return buildDashboardInsights(
    {
      oldestApplied: oldest
        ? {
            applicationId: oldest.id,
            jobId: oldest.jobId,
            seekerName: oldest.seeker.fullName || "A candidate",
            jobTitle: oldest.job.title,
            appliedAt: oldest.appliedAt,
          }
        : null,
      quietListing: quietJob ? { jobId: quietJob.id, title: quietJob.title, views: quietJob._count.views } : null,
    },
    now
  );
}

export const DASHBOARD_RANGES = [7, 30, 60] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

/** `?range=` → 7, 30, or 60 days. Anything else, including a repeated param, falls back to 30. */
export function parseDashboardRange(raw: string | string[] | undefined): DashboardRange {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return (DASHBOARD_RANGES as readonly number[]).includes(value) ? (value as DashboardRange) : 30;
}
