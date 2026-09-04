import type { VerificationStatus } from "@prisma/client";

/**
 * Phase 4.2 — VA identity verification score.
 *
 * IMPORTANT: this score measures IDENTITY CONFIDENCE — i.e. how sure we are
 * this is a real, reachable person who verified their email, submitted a
 * government ID that an admin approved, filled out a complete profile, and
 * has at least one confirmed hire on the platform. It is NOT a measure of
 * skill, work quality, or reliability. UI copy built on top of this score
 * (and `verificationTier`) must not imply otherwise.
 *
 * Pure module — no Prisma import here on purpose, so the formula is
 * unit-testable without a DB. See lib/seeker/identity-verification.ts for
 * the Prisma-backed `recomputeVerificationScore` that gathers the inputs
 * below and persists the result.
 */

export const VERIFICATION_SCORE_WEIGHTS = {
  identity: 40,
  email: 10,
  profile: 30,
  history: 20,
} as const;

/** Confirmed hires are worth 10 points each, capped at two (20 points). */
const POINTS_PER_CONFIRMED_HIRE = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export type VerificationScoreInput = {
  idVerificationStatus: VerificationStatus | null;
  emailVerifiedAt: Date | null;
  /** 0-100; out-of-range values are clamped before scoring. */
  profileCompletionPercent: number;
  /** Distinct companies that hired this seeker (confirmed via Application.hiredAt). */
  confirmedHireCount: number;
};

export type VerificationScoreBreakdown = {
  identity: number;
  email: number;
  profile: number;
  history: number;
};

export type VerificationScoreResult = {
  score: number;
  breakdown: VerificationScoreBreakdown;
};

/**
 * Computes the 0-100 verification score and its per-factor breakdown. Each
 * factor is already clamped to its own weight before summing, so
 * `breakdown.identity + breakdown.email + breakdown.profile + breakdown.history`
 * always equals `score` exactly — no separate final rounding is needed
 * beyond the single `Math.round` applied to the `profile` factor.
 */
export function computeVerificationScore(input: VerificationScoreInput): VerificationScoreResult {
  const identity = input.idVerificationStatus === "APPROVED" ? VERIFICATION_SCORE_WEIGHTS.identity : 0;
  const email = input.emailVerifiedAt ? VERIFICATION_SCORE_WEIGHTS.email : 0;
  const profile = Math.round((clamp(input.profileCompletionPercent, 0, 100) / 100) * VERIFICATION_SCORE_WEIGHTS.profile);
  const history = Math.min(
    Math.max(input.confirmedHireCount, 0) * POINTS_PER_CONFIRMED_HIRE,
    VERIFICATION_SCORE_WEIGHTS.history
  );

  const breakdown: VerificationScoreBreakdown = { identity, email, profile, history };
  const score = clamp(identity + email + profile + history, 0, 100);

  return { score, breakdown };
}

export type VerificationTier = "UNVERIFIED" | "BASIC" | "STRONG" | "TRUSTED";

/** Score-to-label mapping for display: 0 / 1-39 / 40-69 / 70-100. */
export function verificationTier(score: number): VerificationTier {
  if (score <= 0) return "UNVERIFIED";
  if (score <= 39) return "BASIC";
  if (score <= 69) return "STRONG";
  return "TRUSTED";
}
