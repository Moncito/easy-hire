import { describe, expect, it } from "vitest";
import {
  assertTokenUsable,
  createVerificationToken,
  hashVerificationToken,
  EMAIL_VERIFY_TTL_MS,
  PASSWORD_RESET_TTL_MS,
  INVALID_OR_EXPIRED_MESSAGE,
} from "@/lib/auth/credentials-recovery";
import { ApiError } from "@/lib/api-error";

describe("credentials-recovery token lifecycle", () => {
  describe("createVerificationToken / hashVerificationToken", () => {
    it("stores only a SHA-256 hash of the raw token, never the raw value", () => {
      const { token, tokenHash } = createVerificationToken();
      expect(tokenHash).not.toBe(token);
      // sha256 hex digest is always 64 characters
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("hashes deterministically — the same raw token always hashes the same way", () => {
      const { token, tokenHash } = createVerificationToken();
      expect(hashVerificationToken(token)).toBe(tokenHash);
    });

    it("generates a fresh, unpredictable raw token on every call", () => {
      const a = createVerificationToken();
      const b = createVerificationToken();
      expect(a.token).not.toBe(b.token);
      expect(a.tokenHash).not.toBe(b.tokenHash);
    });

    it("hashing two different raw tokens never collides", () => {
      const a = hashVerificationToken("token-a");
      const b = hashVerificationToken("token-b");
      expect(a).not.toBe(b);
    });
  });

  describe("assertTokenUsable", () => {
    const now = new Date("2026-08-29T12:00:00.000Z");
    const future = new Date(now.getTime() + 60_000);
    const past = new Date(now.getTime() - 60_000);

    it("accepts a fresh, unconsumed, unexpired token for the matching purpose", () => {
      expect(() =>
        assertTokenUsable({ purpose: "PASSWORD_RESET", consumedAt: null, expiresAt: future }, "PASSWORD_RESET", now)
      ).not.toThrow();
    });

    it("rejects a missing token record (unknown / already-deleted token)", () => {
      expect(() => assertTokenUsable(null, "PASSWORD_RESET", now)).toThrow(ApiError);
    });

    it("rejects a token whose purpose doesn't match (e.g. an email-verify token used to reset a password)", () => {
      expect(() =>
        assertTokenUsable({ purpose: "EMAIL_VERIFY", consumedAt: null, expiresAt: future }, "PASSWORD_RESET", now)
      ).toThrow(ApiError);
    });

    it("rejects an expired token", () => {
      expect(() =>
        assertTokenUsable({ purpose: "PASSWORD_RESET", consumedAt: null, expiresAt: past }, "PASSWORD_RESET", now)
      ).toThrow(ApiError);
    });

    it("rejects an already-consumed token — the double-consume guard", () => {
      expect(() =>
        assertTokenUsable(
          { purpose: "PASSWORD_RESET", consumedAt: new Date(now.getTime() - 1000), expiresAt: future },
          "PASSWORD_RESET",
          now
        )
      ).toThrow(ApiError);
    });

    it("surfaces the same invalid/expired message for every rejection reason — never distinguishes them to the caller", () => {
      const cases: Array<Parameters<typeof assertTokenUsable>[0]> = [
        null,
        { purpose: "EMAIL_VERIFY", consumedAt: null, expiresAt: future },
        { purpose: "PASSWORD_RESET", consumedAt: null, expiresAt: past },
        { purpose: "PASSWORD_RESET", consumedAt: now, expiresAt: future },
      ];

      for (const record of cases) {
        try {
          assertTokenUsable(record, "PASSWORD_RESET", now);
          throw new Error("expected assertTokenUsable to throw");
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          expect((error as ApiError).message).toBe(INVALID_OR_EXPIRED_MESSAGE);
          expect((error as ApiError).status).toBe(400);
        }
      }
    });

    it("treats a token expiring at exactly `now` as expired (boundary is exclusive)", () => {
      expect(() =>
        assertTokenUsable({ purpose: "PASSWORD_RESET", consumedAt: null, expiresAt: now }, "PASSWORD_RESET", now)
      ).toThrow(ApiError);
    });
  });

  describe("TTL constants", () => {
    it("password reset links expire after 1 hour", () => {
      expect(PASSWORD_RESET_TTL_MS).toBe(60 * 60 * 1000);
    });

    it("email verification links expire after 24 hours — longer-lived since it's non-security-critical account hygiene", () => {
      expect(EMAIL_VERIFY_TTL_MS).toBe(24 * 60 * 60 * 1000);
    });

    it("email verification TTL is strictly longer than password reset TTL", () => {
      expect(EMAIL_VERIFY_TTL_MS).toBeGreaterThan(PASSWORD_RESET_TTL_MS);
    });
  });
});
