import type { ApplicationStatus, HireSource } from "@prisma/client";
import { recomputeVerificationScore } from "@/lib/seeker/identity-verification";
import { recordEvent } from "@/lib/admin/events";

type HireState = {
  status: ApplicationStatus;
  hiredAt: Date | null;
  hireSource: HireSource | null;
  hireConfirmedBySeekerAt: Date | null;
};

type HireData = { hiredAt?: Date; hireSource?: HireSource; hireConfirmedBySeekerAt?: Date };

/**
 * Fields to write when an application moves to `nextStatus`. Empty unless the
 * move is into HIRED. Every hire path (plain employer flow, team workspace,
 * and later offer acceptance) must spread this into its application update so
 * hiredAt/hireSource are stamped the same way everywhere.
 *
 * Stamp-once: hiredAt, hireSource and hireConfirmedBySeekerAt are only set
 * when currently null — a HIRED → other → HIRED round trip never moves them
 * (see the Application.hiredAt schema comment; it anchors the review window).
 * `firstHire` is true only when hiredAt is being stamped now; it gates the
 * CANDIDATE_HIRED event and the verification-score recompute.
 */
export function hiredTransitionData(
  existing: HireState,
  nextStatus: ApplicationStatus | undefined,
  opts: { hireSource: HireSource; seekerConfirmed?: boolean },
  now = new Date()
): { data: HireData; firstHire: boolean } {
  // Only a real move INTO HIRED stamps anything. Re-saving an already-HIRED
  // application (a note, a rating) must not: rows hired through the team
  // workspace before lib/hiring existed are HIRED with hiredAt null, and
  // stamping them on an unrelated edit would invent today as their hire date.
  if (nextStatus !== "HIRED" || existing.status === "HIRED") return { data: {}, firstHire: false };

  const data: HireData = {};
  const firstHire = existing.hiredAt == null;
  if (firstHire) data.hiredAt = now;
  if (existing.hireSource == null) data.hireSource = opts.hireSource;
  if (opts.seekerConfirmed && existing.hireConfirmedBySeekerAt == null) {
    data.hireConfirmedBySeekerAt = now;
  }
  return { data, firstHire };
}

/** Side effects of a first hire. Call after the transaction commits, only when firstHire is true. */
export function afterFirstHire(args: {
  seekerProfileId: string;
  applicationId: string;
  jobId: string;
  actorType: "EMPLOYER" | "SEEKER";
  actorUserId?: string;
}): void {
  // A confirmed hire feeds the "history" factor of the verification score
  // (see lib/seeker/verification-score.ts). Fire-and-forget: must never
  // block the hiring transition.
  void recomputeVerificationScore(args.seekerProfileId).catch((err) =>
    console.error("[hiring] verification score recompute failed:", err)
  );

  recordEvent({
    eventType: "CANDIDATE_HIRED",
    actorType: args.actorType,
    ...(args.actorUserId ? { userId: args.actorUserId } : {}),
    entityType: "APPLICATION",
    entityId: args.applicationId,
    metadata: { jobId: args.jobId },
  });
}
