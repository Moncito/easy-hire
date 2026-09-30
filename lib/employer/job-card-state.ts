import { daysBetween } from "@/lib/employer/dashboard-insights";
import { waitSeverity, type WaitSeverity } from "@/lib/employer/attention";
import type { EmployerJobCardData } from "@/lib/employer/jobs-board";

/**
 * JOB CARD STATE (Pro job postings)
 * =================================
 * Everything the card needs to decide how it looks and what it offers,
 * worked out in one pure function so the rules are tested, not scattered
 * through JSX:
 *
 *  - lifecycle: active / unlisted (approved, company not yet verified) /
 *    draft / revision (draft sent back by an admin) / pending / closed.
 *    A healthy active job shows no badge — only exceptions are labelled.
 *  - waiting: unreviewed applicants, with the shared two-level severity
 *    (marigold from 3 days, Ember past 14). Only on active listings.
 *  - primary: the single main action. Marigold ("primary") only when
 *    something is waiting on you or a draft needs finishing; otherwise
 *    the quiet secondary button.
 */

export type JobLifecycle = "active" | "unlisted" | "draft" | "revision" | "pending" | "closed";

export type JobPrimary = {
  kind: "review" | "view" | "share" | "edit" | "submission" | "archive";
  label: string;
  href: string;
  emphasis: "primary" | "secondary";
};

export type JobCardState = {
  lifecycle: JobLifecycle;
  waiting: { count: number; days: number; severity: WaitSeverity } | null;
  primary: JobPrimary;
  /** The public /jobs/[id] page exists and can be shared. */
  isPublic: boolean;
};

type Input = Pick<
  EmployerJobCardData,
  "id" | "status" | "reviewRejectionReason" | "unreviewedCount" | "oldestUnreviewedAt" | "applicantCount"
>;

function lifecycleOf(job: Input, companyVerified: boolean): JobLifecycle {
  if (job.status === "ACTIVE") return companyVerified ? "active" : "unlisted";
  if (job.status === "DRAFT") return job.reviewRejectionReason ? "revision" : "draft";
  if (job.status === "PENDING_REVIEW") return "pending";
  return "closed";
}

export function jobCardState(job: Input, companyVerified: boolean, now: Date): JobCardState {
  const lifecycle = lifecycleOf(job, companyVerified);
  const isPublic = lifecycle === "active";
  const applicantsHref = `/employer/jobs/${job.id}/applicants`;
  const editHref = `/employer/jobs/${job.id}/edit`;

  const live = lifecycle === "active" || lifecycle === "unlisted";
  let waiting: JobCardState["waiting"] = null;
  if (live && job.unreviewedCount > 0) {
    const days = job.oldestUnreviewedAt ? daysBetween(new Date(job.oldestUnreviewedAt), now) : 0;
    waiting = { count: job.unreviewedCount, days, severity: waitSeverity(days) };
  }

  let primary: JobPrimary;
  if (lifecycle === "draft" || lifecycle === "revision") {
    primary = { kind: "edit", label: "Continue editing", href: editHref, emphasis: "primary" };
  } else if (lifecycle === "pending") {
    primary = { kind: "submission", label: "View submission", href: editHref, emphasis: "secondary" };
  } else if (lifecycle === "closed") {
    primary = { kind: "archive", label: "View archive", href: applicantsHref, emphasis: "secondary" };
  } else if (job.unreviewedCount > 0) {
    primary = { kind: "review", label: "Review applicants", href: applicantsHref, emphasis: "primary" };
  } else if (job.applicantCount === 0 && isPublic) {
    primary = { kind: "share", label: "Share listing", href: `/jobs/${job.id}`, emphasis: "secondary" };
  } else {
    primary = { kind: "view", label: "View applicants", href: applicantsHref, emphasis: "secondary" };
  }

  return { lifecycle, waiting, primary, isPublic };
}

/**
 * The page-level alarm on Job postings: listings whose oldest unreviewed
 * applicant is past the 14-day target, and the single longest wait. Null
 * when nothing is overdue — 3–14 day waits show on the cards only.
 */
export function overdueSummary(
  jobs: Array<Input & Pick<EmployerJobCardData, "title">>,
  companyVerified: boolean,
  now: Date
): { jobCount: number; oldest: { jobId: string; title: string; days: number } } | null {
  let jobCount = 0;
  let oldest: { jobId: string; title: string; days: number } | null = null;
  for (const job of jobs) {
    const waiting = jobCardState(job, companyVerified, now).waiting;
    if (waiting?.severity !== "critical") continue;
    jobCount++;
    if (!oldest || waiting.days > oldest.days) oldest = { jobId: job.id, title: job.title, days: waiting.days };
  }
  return oldest ? { jobCount, oldest } : null;
}

/**
 * Everything the Pro Job postings page works out once per request: one
 * clock for every card (the job list is cached, so waits are computed at
 * render time) and the overdue alarm.
 */
export function proJobsPageView(
  jobs: Array<Input & Pick<EmployerJobCardData, "title">>,
  companyVerified: boolean,
  now: Date = new Date()
) {
  return { now: now.getTime(), overdue: overdueSummary(jobs, companyVerified, now) };
}
