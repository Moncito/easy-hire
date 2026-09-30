import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/employer/dashboard-insights";
import { waitSeverity, type WaitSeverity } from "@/lib/employer/attention";
import { MIN_VIEWS_FOR_RATE } from "@/lib/employer/dashboard-pipeline";

/**
 * PRO DASHBOARD — ACTIVE ROLES TABLE
 * ==================================
 * Every ACTIVE listing — the same set as the Active jobs tile, so "6
 * listings" here always matches it. (The older analytics list capped at six
 * and mixed in listings still pending review.)
 *
 * Status is shown only when a role needs something from you; a healthy
 * role has an empty status cell. A waiting count follows the shared
 * two-level rule (waitSeverity): marigold from 3 days, Ember past 14.
 * `pipeline` is where each application currently sits, for the per-row bar. The view → apply rate needs at least
 * MIN_VIEWS_FOR_RATE views to mean anything.
 */

const REMOTE_LABEL: Record<string, string> = { REMOTE: "Remote", ONSITE: "On-site", HYBRID: "Hybrid" };

export type RoleStatus =
  | { kind: "needs-review"; count: number; oldestDays: number | null; severity: WaitSeverity }
  | { kind: "no-applicants" }
  | null;

/** Current stage of each open-or-hired application on the role. Rejected ones are left out. */
export type RolePipeline = { applied: number; shortlisted: number; interview: number; hired: number };

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
  pipeline: RolePipeline;
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
  shortlisted?: number;
  interview?: number;
};

/** Pure. One table row: status exception, filled state, conversion, and the single primary action. */
export function buildRoleRow(job: RoleInput, companyVerified: boolean, now: Date): RoleRow {
  const applicantsHref = `/employer/jobs/${job.id}/applicants`;
  // A public link only works once the company is verified.
  const shareable = companyVerified;

  const oldestDays = job.oldestPendingAt ? daysBetween(job.oldestPendingAt, now) : null;
  const status: RoleStatus =
    job.pending > 0
      ? { kind: "needs-review", count: job.pending, oldestDays, severity: waitSeverity(oldestDays) }
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
    pipeline: {
      applied: job.pending,
      shortlisted: job.shortlisted ?? 0,
      interview: job.interview ?? 0,
      hired: job.hired,
    },
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

  // One grouped query: current-stage counts per role, plus the oldest
  // still-unreviewed application for the wait severity.
  const byStage = await prisma.application.groupBy({
    by: ["jobId", "status"],
    where: { jobId: { in: jobIds }, status: { in: ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED"] } },
    _count: { _all: true },
    _min: { appliedAt: true },
  });
  const count = (jobId: string, status: string) =>
    byStage.find((r) => r.jobId === jobId && r.status === status)?._count._all ?? 0;
  const oldestPending = (jobId: string) =>
    byStage.find((r) => r.jobId === jobId && r.status === "APPLIED")?._min.appliedAt ?? null;

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
          pending: count(job.id, "APPLIED"),
          oldestPendingAt: oldestPending(job.id),
          hired: count(job.id, "HIRED"),
          shortlisted: count(job.id, "SHORTLISTED"),
          interview: count(job.id, "INTERVIEW"),
        },
        companyVerified,
        now
      )
    )
  );
}
