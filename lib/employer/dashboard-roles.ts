import { prisma } from "@/lib/prisma";
import { DECISION_TARGET_DAYS, daysBetween } from "@/lib/employer/dashboard-insights";
import { MIN_VIEWS_FOR_RATE } from "@/lib/employer/dashboard-pipeline";

/**
 * PRO DASHBOARD — ACTIVE ROLES TABLE
 * ==================================
 * Every ACTIVE listing — the same set as the Active jobs tile, so "6
 * listings" here always matches it. (The older analytics list capped at six
 * and mixed in listings still pending review.)
 *
 * Status is shown only when a role needs something from you; a healthy
 * role has an empty status cell. The view → apply rate needs at least
 * MIN_VIEWS_FOR_RATE views to mean anything.
 */

const REMOTE_LABEL: Record<string, string> = { REMOTE: "Remote", ONSITE: "On-site", HYBRID: "Hybrid" };

export type RoleStatus =
  | { kind: "needs-review"; count: number; overdue: boolean }
  | { kind: "no-applicants" }
  | null;

export type RoleRow = {
  id: string;
  title: string;
  meta: string;
  views: number;
  applicants: number;
  hired: number;
  target: number;
  filled: boolean;
  conversion: number | null;
  status: RoleStatus;
  primary: { kind: "review" | "share" | "view"; label: string; href: string };
  shareable: boolean;
};

type RoleInput = {
  id: string;
  title: string;
  location: string;
  remoteType: string;
  targetHireCount: number;
  views: number;
  applicants: number;
  pending: number;
  oldestPendingAt: Date | null;
  hired: number;
};

/** Pure. One table row: status exception, filled state, conversion, and the single primary action. */
export function buildRoleRow(job: RoleInput, companyVerified: boolean, now: Date): RoleRow {
  const applicantsHref = `/employer/jobs/${job.id}/applicants`;
  // A public link only works once the company is verified.
  const shareable = companyVerified;

  const status: RoleStatus =
    job.pending > 0
      ? {
          kind: "needs-review",
          count: job.pending,
          overdue: job.oldestPendingAt !== null && daysBetween(job.oldestPendingAt, now) > DECISION_TARGET_DAYS,
        }
      : job.applicants === 0
        ? { kind: "no-applicants" }
        : null;

  const primary: RoleRow["primary"] =
    job.pending > 0
      ? { kind: "review", label: "Review", href: applicantsHref }
      : job.applicants === 0 && shareable
        ? { kind: "share", label: "Share listing", href: `/jobs/${job.id}` }
        : { kind: "view", label: "View applicants", href: applicantsHref };

  return {
    id: job.id,
    title: job.title,
    meta: [job.location, REMOTE_LABEL[job.remoteType] ?? job.remoteType].filter(Boolean).join(" · "),
    views: job.views,
    applicants: job.applicants,
    hired: job.hired,
    target: job.targetHireCount,
    filled: job.targetHireCount > 0 && job.hired >= job.targetHireCount,
    conversion: job.views >= MIN_VIEWS_FOR_RATE ? Math.round((job.applicants / job.views) * 100) : null,
    status,
    primary,
    shareable,
  };
}

/** Pure. Roles needing review first (most waiting first), then busiest. */
export function sortRoleRows(rows: RoleRow[]): RoleRow[] {
  const pending = (r: RoleRow) => (r.status?.kind === "needs-review" ? r.status.count : 0);
  return [...rows].sort(
    (a, b) => pending(b) - pending(a) || b.applicants - a.applicants || b.views - a.views || a.title.localeCompare(b.title)
  );
}

export async function getDashboardRoles(
  companyId: string,
  companyVerified: boolean,
  now: Date = new Date()
): Promise<RoleRow[]> {
  const jobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      location: true,
      remoteType: true,
      targetHireCount: true,
      _count: { select: { applications: true, views: true } },
    },
  });
  const jobIds = jobs.map((j) => j.id);

  const [pendingByJob, hiredByJob] = await Promise.all([
    prisma.application.groupBy({
      by: ["jobId"],
      where: { jobId: { in: jobIds }, status: "APPLIED" },
      _count: { _all: true },
      _min: { appliedAt: true },
    }),
    prisma.application.groupBy({
      by: ["jobId"],
      where: { jobId: { in: jobIds }, status: "HIRED" },
      _count: { _all: true },
    }),
  ]);
  const pending = new Map(pendingByJob.map((r) => [r.jobId, r]));
  const hired = new Map(hiredByJob.map((r) => [r.jobId, r._count._all]));

  return sortRoleRows(
    jobs.map((job) =>
      buildRoleRow(
        {
          id: job.id,
          title: job.title,
          location: job.location,
          remoteType: job.remoteType,
          targetHireCount: job.targetHireCount,
          views: job._count.views,
          applicants: job._count.applications,
          pending: pending.get(job.id)?._count._all ?? 0,
          oldestPendingAt: pending.get(job.id)?._min.appliedAt ?? null,
          hired: hired.get(job.id) ?? 0,
        },
        companyVerified,
        now
      )
    )
  );
}
