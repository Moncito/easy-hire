import { describe, expect, it } from "vitest";
import { resolveGoogleAccountLinkingAction } from "@/lib/auth/google-account-linking";

describe("resolveGoogleAccountLinkingAction", () => {
  it("creates a new user when no account exists for the email", () => {
    expect(resolveGoogleAccountLinkingAction(null)).toEqual({ type: "create" });
  });

  it("evicts an unverified password claim (the squatter-hijack case)", () => {
    const result = resolveGoogleAccountLinkingAction({
      id: "user-1",
      emailVerifiedAt: null,
      passwordHash: "some-bcrypt-hash",
    });

    expect(result).toEqual({ type: "evictUnverifiedPassword", userId: "user-1" });
  });

  it("backfills verification for an already Google-only account with no stamp", () => {
    const result = resolveGoogleAccountLinkingAction({
      id: "user-2",
      emailVerifiedAt: null,
      passwordHash: null,
    });

    expect(result).toEqual({ type: "backfillVerification", userId: "user-2" });
  });

  it("links as-is when the existing account is already verified (has a password)", () => {
    const result = resolveGoogleAccountLinkingAction({
      id: "user-3",
      emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
      passwordHash: "some-bcrypt-hash",
    });

    expect(result).toEqual({ type: "linkAsIs", userId: "user-3" });
  });

  it("links as-is when the existing account is already verified (Google-only)", () => {
    const result = resolveGoogleAccountLinkingAction({
      id: "user-4",
      emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
      passwordHash: null,
    });

    expect(result).toEqual({ type: "linkAsIs", userId: "user-4" });
  });
});
