import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  isSessionRevoked,
  sessionReissueProof,
  verifySessionReissueProof,
} from "@/lib/auth/session-revocation";

describe("isSessionRevoked", () => {
  const cutoff = new Date("2026-09-25T12:00:00.000Z");

  it("never revokes when no cutoff has been set", () => {
    expect(isSessionRevoked(0, null)).toBe(false);
    expect(isSessionRevoked(undefined, null)).toBe(false);
  });

  it("revokes tokens issued before the cutoff", () => {
    expect(isSessionRevoked(cutoff.getTime() - 1, cutoff)).toBe(true);
  });

  it("keeps tokens issued at or after the cutoff", () => {
    expect(isSessionRevoked(cutoff.getTime(), cutoff)).toBe(false);
    expect(isSessionRevoked(cutoff.getTime() + 1, cutoff)).toBe(false);
  });

  it("treats a token without sessionIssuedAt as predating any cutoff", () => {
    expect(isSessionRevoked(undefined, cutoff)).toBe(true);
  });
});

describe("session reissue proof", () => {
  beforeAll(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
  });

  const cutoff = new Date("2026-09-25T12:00:00.000Z");

  it("accepts the proof it issued", () => {
    const proof = sessionReissueProof("user_1", cutoff);
    expect(verifySessionReissueProof("user_1", cutoff, proof)).toBe(true);
  });

  it("rejects a proof for another user", () => {
    const proof = sessionReissueProof("user_2", cutoff);
    expect(verifySessionReissueProof("user_1", cutoff, proof)).toBe(false);
  });

  it("rejects a proof for an older cutoff", () => {
    const stale = sessionReissueProof("user_1", new Date(cutoff.getTime() - 1));
    expect(verifySessionReissueProof("user_1", cutoff, stale)).toBe(false);
  });

  it("rejects missing, malformed, and non-string proofs", () => {
    expect(verifySessionReissueProof("user_1", cutoff, undefined)).toBe(false);
    expect(verifySessionReissueProof("user_1", cutoff, "")).toBe(false);
    expect(verifySessionReissueProof("user_1", cutoff, "not-hex")).toBe(false);
    expect(verifySessionReissueProof("user_1", cutoff, 42)).toBe(false);
  });
});
