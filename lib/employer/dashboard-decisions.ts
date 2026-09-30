import type { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysBetween } from "@/lib/employer/dashboard-insights";

/**
 * PRO DASHBOARD — DECISION QUEUE, CANDIDATES IN PROGRESS, RECENT ACTIVITY
 * ======================================================================
 * - The decision queue is APPLIED applications on every job, oldest first:
 *   the same population as the sidebar badge and the Needs review tile, so
 *   all three show the same count.
 * - "In progress" groups open applications (applied, shortlisted, in
 *   interview) on active listings by candidate, so one person applying to
 *   three roles is one row, not three.
 * - Recent activity merges applications with recorded stage moves.
 */

const QUEUE_LIMIT = 4;
const CANDIDATE_LIMIT = 6;
const ACTIVITY_LIMIT = 8;
/** Relative times ("3d ago") up to this age; older events show a date. */
const RELATIVE_TIME_DAYS = 14;

export type QueueItem = {
  applicationId: string;
  jobId: string;
  seekerName: string;
  seekerPhotoUrl: string | null;
  role: string;
  appliedLabel: string;
  waitingDays: number;
};

export type InProgressCandidate = {
  seekerId: string;
  name: string;
  photoUrl: string | null;
  applications: Array<{ applicationId: string; jobId: string; role: string; status: "APPLIED" | "SHORTLISTED" | "INTERVIEW" }>;
};

export type ActivityEvent = {
  id: string;
  seekerName: string;
  seekerPhotoUrl: string | null;
  /** Sentence after the name, e.g. "moved to interview for Bookkeeper". */
  text: string;
  at: Date;
  timeLabel: string;
  href: string;
};

export type DashboardDecisions = {
  queue: QueueItem[];
  queueTotal: number;
  inProgress: InProgressCandidate[];
  inProgressCandidateCount: number;
  inProgressApplicationCount: number;
  activity: ActivityEvent[];
};

function shortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Pure. "Just now", "12m ago", "5h ago", "9d ago" under 14 days; a date after that. */
export function formatActivityTime(at: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = daysBetween(at, now);
  if (days < RELATIVE_TIME_DAYS) return `${days}d ago`;
  return shortDate(at);
}

const STAGE_RANK: Record<"APPLIED" | "SHORTLISTED" | "INTERVIEW", number> = { INTERVIEW: 0, SHORTLISTED: 1, APPLIED: 2 };

/**
 * Pure. Groups open applications by candidate. Candidates furthest along
 * come first (anyone in interview, then shortlisted, then applied), then by
 * how many of your roles they're in; each candidate's chips follow the same
 * stage order.
 */
export function groupByCandidate(
  rows: Array<{
    applicationId: string;
    jobId: string;
    role: string;
    status: "APPLIED" | "SHORTLISTED" | "INTERVIEW";
    seekerId: string;
    name: string;
    photoUrl: string | null;
  }>
): InProgressCandidate[] {
  const byId = new Map<string, InProgressCandidate>();
  for (const row of rows) {
    const entry = byId.get(row.seekerId) ?? {
      seekerId: row.seekerId,
      name: row.name,
      photoUrl: row.photoUrl,
      applications: [],
    };
    entry.applications.push({ applicationId: row.applicationId, jobId: row.jobId, role: row.role, status: row.status });
    byId.set(row.seekerId, entry);
  }
  const best = (c: InProgressCandidate) => Math.min(...c.applications.map((a) => STAGE_RANK[a.status]));
  const candidates = [...byId.values()];
  for (const c of candidates) c.applications.sort((a, b) => STAGE_RANK[a.status] - STAGE_RANK[b.status]);
  return candidates.sort(
    (a, b) => best(a) - best(b) || b.applications.length - a.applications.length || a.name.localeCompare(b.name)
  );
}

/** Pure. The sentence for a recorded stage move. */
export function stageMoveText(toStatus: ApplicationStatus, role: string): string {
  switch (toStatus) {
    case "SHORTLISTED":
      return `was shortlisted for ${role}`;
    case "INTERVIEW":
      return `moved to interview for ${role}`;
    case "HIRED":
      return `was hired for ${role}`;
    case "REJECTED":
      return `was declined for ${role}`;
    case "APPLIED":
      return `was moved back to review for ${role}`;
  }
}

export async function getDashboardDecisions(companyId: string, now: Date = new Date()): Promise<DashboardDecisions> {
  const seekerSelect = { id: true, fullName: true, photoUrl: true } as const;

  const [queueRows, queueTotal, openRows, recentApplied, recentMoves] = await Promise.all([
    prisma.application.findMany({
      where: { status: "APPLIED", job: { companyId } },
      orderBy: { appliedAt: "asc" },
      take: QUEUE_LIMIT,
      select: { id: true, appliedAt: true, jobId: true, job: { select: { title: true } }, seeker: { select: seekerSelect } },
    }),
    prisma.application.count({ where: { status: "APPLIED", job: { companyId } } }),
    prisma.application.findMany({
      where: { status: { in: ["APPLIED", "SHORTLISTED", "INTERVIEW"] }, job: { companyId, status: "ACTIVE" } },
      select: { id: true, status: true, jobId: true, job: { select: { title: true } }, seeker: { select: seekerSelect } },
    }),
    prisma.application.findMany({
      where: { job: { companyId } },
      orderBy: { appliedAt: "desc" },
      take: ACTIVITY_LIMIT,
      select: { id: true, appliedAt: true, jobId: true, job: { select: { title: true } }, seeker: { select: seekerSelect } },
    }),
    prisma.applicationActivity.findMany({
      where: { type: "STAGE_CHANGE", toStatus: { not: null }, application: { job: { companyId } } },
      orderBy: { createdAt: "desc" },
      take: ACTIVITY_LIMIT,
      select: {
        id: true,
        toStatus: true,
        createdAt: true,
        application: { select: { id: true, jobId: true, job: { select: { title: true } }, seeker: { select: seekerSelect } } },
      },
    }),
  ]);

  const grouped = groupByCandidate(
    openRows.map((r) => ({
      applicationId: r.id,
      jobId: r.jobId,
      role: r.job.title,
      status: r.status as "APPLIED" | "SHORTLISTED" | "INTERVIEW",
      seekerId: r.seeker.id,
      name: r.seeker.fullName || "Candidate",
      photoUrl: r.seeker.photoUrl,
    }))
  );

  const applicantsHref = (jobId: string, applicationId: string) =>
    `/employer/jobs/${jobId}/applicants?application=${applicationId}`;

  const events: ActivityEvent[] = [
    ...recentApplied.map((a) => ({
      id: `applied-${a.id}`,
      seekerName: a.seeker.fullName || "A candidate",
      seekerPhotoUrl: a.seeker.photoUrl,
      text: `applied for ${a.job.title}`,
      at: a.appliedAt,
      timeLabel: formatActivityTime(a.appliedAt, now),
      href: applicantsHref(a.jobId, a.id),
    })),
    ...recentMoves.map((m) => ({
      id: `move-${m.id}`,
      seekerName: m.application.seeker.fullName || "A candidate",
      seekerPhotoUrl: m.application.seeker.photoUrl,
      text: stageMoveText(m.toStatus!, m.application.job.title),
      at: m.createdAt,
      timeLabel: formatActivityTime(m.createdAt, now),
      href: applicantsHref(m.application.jobId, m.application.id),
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, ACTIVITY_LIMIT);

  return {
    queue: queueRows.map((r) => ({
      applicationId: r.id,
      jobId: r.jobId,
      seekerName: r.seeker.fullName || "Candidate",
      seekerPhotoUrl: r.seeker.photoUrl,
      role: r.job.title,
      appliedLabel: shortDate(r.appliedAt),
      waitingDays: daysBetween(r.appliedAt, now),
    })),
    queueTotal,
    inProgress: grouped.slice(0, CANDIDATE_LIMIT),
    inProgressCandidateCount: grouped.length,
    inProgressApplicationCount: openRows.length,
    activity: events,
  };
}
