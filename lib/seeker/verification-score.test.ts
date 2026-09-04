import { describe, expect, it } from "vitest";
import {
  VERIFICATION_SCORE_WEIGHTS,
  computeVerificationScore,
  verificationTier,
} from "@/lib/seeker/verification-score";

describe("computeVerificationScore", () => {
  it("returns a zero score with a zeroed breakdown for a brand-new profile", () => {
    const result = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: 0,
      confirmedHireCount: 0,
    });

    expect(result.score).toBe(0);
    expect(result.breakdown).toEqual({ identity: 0, email: 0, profile: 0, history: 0 });
  });

  it("awards only the identity weight when APPROVED and nothing else is set", () => {
    const result = computeVerificationScore({
      idVerificationStatus: "APPROVED",
      emailVerifiedAt: null,
      profileCompletionPercent: 0,
      confirmedHireCount: 0,
    });

    expect(result.score).toBe(VERIFICATION_SCORE_WEIGHTS.identity);
    expect(result.breakdown.identity).toBe(40);
    expect(result.breakdown.email).toBe(0);
    expect(result.breakdown.profile).toBe(0);
    expect(result.breakdown.history).toBe(0);
  });

  it("does not award the identity weight for PENDING or REJECTED status", () => {
    for (const status of ["PENDING", "REJECTED"] as const) {
      const result = computeVerificationScore({
        idVerificationStatus: status,
        emailVerifiedAt: null,
        profileCompletionPercent: 0,
        confirmedHireCount: 0,
      });
      expect(result.breakdown.identity).toBe(0);
    }
  });

  it("reaches a full 100 when every factor is maxed out", () => {
    const result = computeVerificationScore({
      idVerificationStatus: "APPROVED",
      emailVerifiedAt: new Date("2026-01-01"),
      profileCompletionPercent: 100,
      confirmedHireCount: 5, // well above the 2-hire cap
    });

    expect(result.score).toBe(100);
    expect(result.breakdown).toEqual({ identity: 40, email: 10, profile: 30, history: 20 });
  });

  it("always sums the breakdown to the total score, across a range of inputs", () => {
    const cases = [
      { idVerificationStatus: "APPROVED" as const, emailVerifiedAt: new Date(), profileCompletionPercent: 37, confirmedHireCount: 1 },
      { idVerificationStatus: null, emailVerifiedAt: new Date(), profileCompletionPercent: 63, confirmedHireCount: 0 },
      { idVerificationStatus: "REJECTED" as const, emailVerifiedAt: null, profileCompletionPercent: 82, confirmedHireCount: 3 },
      { idVerificationStatus: "PENDING" as const, emailVerifiedAt: new Date(), profileCompletionPercent: 5, confirmedHireCount: 2 },
    ];

    for (const input of cases) {
      const { score, breakdown } = computeVerificationScore(input);
      expect(breakdown.identity + breakdown.email + breakdown.profile + breakdown.history).toBe(score);
    }
  });

  it("caps the history factor at 20 points (2 confirmed hires) regardless of how many more there are", () => {
    const twoHires = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: 0,
      confirmedHireCount: 2,
    });
    const tenHires = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: 0,
      confirmedHireCount: 10,
    });

    expect(twoHires.breakdown.history).toBe(20);
    expect(tenHires.breakdown.history).toBe(20);
  });

  it("awards 10 points per confirmed hire below the cap", () => {
    const oneHire = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: 0,
      confirmedHireCount: 1,
    });
    expect(oneHire.breakdown.history).toBe(10);
  });

  it("rounds the profile completeness factor to the nearest point", () => {
    // 1/3 of 30 = 10, exact.
    const oneThird = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: (1 / 3) * 100,
      confirmedHireCount: 0,
    });
    expect(oneThird.breakdown.profile).toBe(10);

    // 50% of 30 = 15, exact.
    const half = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: 50,
      confirmedHireCount: 0,
    });
    expect(half.breakdown.profile).toBe(15);

    // 83% of 30 = 24.9 -> rounds to 25.
    const eightyThree = computeVerificationScore({
      idVerificationStatus: null,
      emailVerifiedAt: null,
      profileCompletionPercent: 83,
      confirmedHireCount: 0,
    });
    expect(eightyThree.breakdown.profile).toBe(25);
  });
});

describe("verificationTier", () => {
  it("returns UNVERIFIED at exactly 0", () => {
    expect(verificationTier(0)).toBe("UNVERIFIED");
  });

  it("returns BASIC at the bottom (1) and top (39) of its range", () => {
    expect(verificationTier(1)).toBe("BASIC");
    expect(verificationTier(39)).toBe("BASIC");
  });

  it("returns STRONG at the bottom (40) and top (69) of its range", () => {
    expect(verificationTier(40)).toBe("STRONG");
    expect(verificationTier(69)).toBe("STRONG");
  });

  it("returns TRUSTED at the bottom (70) and top (100) of its range", () => {
    expect(verificationTier(70)).toBe("TRUSTED");
    expect(verificationTier(100)).toBe("TRUSTED");
  });
});
