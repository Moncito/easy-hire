import type { ApplicationStatus, Prisma } from "@prisma/client";

/**
 * APPLICATION STAGE HISTORY
 * =========================
 * Every status change writes one STAGE_CHANGE ApplicationActivity row with
 * structured from/to columns. Both status-change paths call this — the plain
 * employer flow (lib/jobs/applications.ts's updateApplication) and
 * collaborative hiring (lib/collaborative-hiring-reviews.ts's
 * updateCollaborativePipeline) — so the history is complete from
 * 2026-09-30 on. The dashboard reads it to chart "moved to interview" by day,
 * to count how far a now-REJECTED application got, and for recent activity.
 *
 * `body` keeps the "FROM → TO" text the collaborative activity timeline
 * already renders, so nothing that displays these rows changes.
 */

export function stageChangeActivityData(input: {
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  /** Collaborative-hiring member who moved it. The plain employer flow has no member row, so it passes null. */
  actorMemberId: string | null;
}): Prisma.ApplicationActivityUncheckedCreateInput {
  return {
    applicationId: input.applicationId,
    type: "STAGE_CHANGE",
    body: `${input.fromStatus} → ${input.toStatus}`,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorMemberId: input.actorMemberId,
  };
}

/** Order of progress. REJECTED is an outcome, not a stage, so it has no rank. */
const STAGE_RANK: Partial<Record<ApplicationStatus, number>> = {
  APPLIED: 0,
  SHORTLISTED: 1,
  INTERVIEW: 2,
  HIRED: 3,
};

/**
 * Pure. The furthest stage an application reached, from its current status
 * and every status it has passed through. A REJECTED application counts as
 * reaching whatever it had got to before rejection; with no history, that's
 * APPLIED — the honest floor, never a guess upward.
 */
export function furthestStageReached(
  currentStatus: ApplicationStatus,
  historyStatuses: ApplicationStatus[]
): "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "HIRED" {
  let best: "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "HIRED" = "APPLIED";
  for (const status of [currentStatus, ...historyStatuses]) {
    const rank = STAGE_RANK[status];
    if (rank !== undefined && rank > STAGE_RANK[best]!) {
      best = status as typeof best;
    }
  }
  return best;
}
