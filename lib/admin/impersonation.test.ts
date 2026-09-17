import { beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  IMPERSONATION_TTL_MS,
  assertNoActiveSession,
  assertNotSelfImpersonation,
  assertTargetNotAdmin,
  canEndImpersonation,
  isSessionActive,
} from "@/lib/admin/impersonation";
import { hasPermission, resolveAdminAccess } from "@/lib/admin/permissions";
import {
  IMPERSONATION_COOKIE_NAME,
  signImpersonationToken,
  verifyImpersonationToken,
} from "@/lib/admin/impersonation-token";

// This suite follows lib/admin/permissions.test.ts's convention: prefer
// pure, DB-free functions so the rules are unit-testable without a Prisma
// connection. lib/admin/impersonation.ts's DB-facing functions
// (startImpersonation/endImpersonation/resolveActiveImpersonation) are thin
// orchestration around exactly the pure predicates exercised below.

beforeAll(() => {
  // impersonation-token.ts reads AUTH_SECRET/NEXTAUTH_SECRET at call time
  // (not at module load), so pinning a deterministic test secret here makes
  // this suite independent of whatever .env happens to be loaded.
  process.env.AUTH_SECRET = "test-impersonation-secret-do-not-use-elsewhere";
});

describe("IMPERSONATION_COOKIE_NAME / IMPERSONATION_TTL_MS", () => {
  it("TTL is exactly 1 hour, per §8.2", () => {
    expect(IMPERSONATION_TTL_MS).toBe(60 * 60 * 1000);
  });

  it("cookie name is a single non-empty constant", () => {
    expect(typeof IMPERSONATION_COOKIE_NAME).toBe("string");
    expect(IMPERSONATION_COOKIE_NAME.length).toBeGreaterThan(0);
  });
});

describe("isSessionActive — TTL boundary", () => {
  it("is active just inside the TTL (1ms before expiry)", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 1);
    expect(isSessionActive({ endedAt: null, expiresAt }, now)).toBe(true);
  });

  it("is NOT active at the exact expiry instant — strict inequality, fail closed at the boundary", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime());
    expect(isSessionActive({ endedAt: null, expiresAt }, now)).toBe(false);
  });

  it("is NOT active 1ms past expiry", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime() - 1);
    expect(isSessionActive({ endedAt: null, expiresAt }, now)).toBe(false);
  });

  it("an ended session resolves inactive regardless of expiresAt, even if expiresAt is still in the future", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
    expect(isSessionActive({ endedAt: new Date(now.getTime() - 1000), expiresAt }, now)).toBe(false);
  });
});

describe("assertNotSelfImpersonation — refuses self-targeting", () => {
  it("throws a 400 ApiError when adminUserId === targetUserId", () => {
    try {
      assertNotSelfImpersonation("admin-1", "admin-1");
      expect.fail("expected assertNotSelfImpersonation to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });

  it("never blocks a different target", () => {
    expect(() => assertNotSelfImpersonation("admin-1", "user-2")).not.toThrow();
  });
});

describe("assertTargetNotAdmin — refuses every ADMIN-role target", () => {
  it("throws a 403 ApiError when the target is Role.ADMIN", () => {
    try {
      assertTargetNotAdmin("ADMIN");
      expect.fail("expected assertTargetNotAdmin to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("this is strictly stronger than 'never against another SUPER_ADMIN' — it refuses EVERY admin, SUPER_ADMIN or not, since Role.ADMIN carries no AdminLevel distinction at this layer", () => {
    // There is no way to construct a Role.ADMIN target that is "not really
    // an admin" — the refusal is unconditional on role alone.
    expect(() => assertTargetNotAdmin("ADMIN")).toThrow(ApiError);
  });

  it("never blocks a SEEKER or EMPLOYER target", () => {
    expect(() => assertTargetNotAdmin("SEEKER")).not.toThrow();
    expect(() => assertTargetNotAdmin("EMPLOYER")).not.toThrow();
  });
});

describe("assertNoActiveSession — one active session per admin", () => {
  it("throws a 409 ApiError when the admin already has an active session", () => {
    try {
      assertNoActiveSession(true);
      expect.fail("expected assertNoActiveSession to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
    }
  });

  it("does not throw when the admin has no active session", () => {
    expect(() => assertNoActiveSession(false)).not.toThrow();
  });
});

describe("refusing an admin lacking `impersonate` (composed from lib/admin/permissions.ts's own pure primitives — the same rule requireAdminPermission enforces via the DB)", () => {
  it("a SUPPORT-level admin does not have `impersonate`", () => {
    const access = resolveAdminAccess({ userId: "u", profile: { level: "SUPPORT", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(access, "impersonate")).toBe(false);
  });

  it("a FINANCE-level admin does not have `impersonate`, even via an additive grant (SUPER_ADMIN-only floor)", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "FINANCE", permissions: ["impersonate"] },
      totalAdminProfileCount: 1,
    });
    expect(hasPermission(access, "impersonate")).toBe(false);
  });

  it("only a SUPER_ADMIN-level admin has `impersonate`", () => {
    const access = resolveAdminAccess({ userId: "u", profile: { level: "SUPER_ADMIN", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(access, "impersonate")).toBe(true);
  });
});

describe("mid-session permission loss kills the session immediately (the same `hasPermission` re-check resolveActiveImpersonation performs against the admin's LIVE access)", () => {
  it("an admin demoted from SUPER_ADMIN to SUPPORT no longer holds `impersonate`", () => {
    const beforeDemotion = resolveAdminAccess({ userId: "u", profile: { level: "SUPER_ADMIN", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(beforeDemotion, "impersonate")).toBe(true);

    const afterDemotion = resolveAdminAccess({ userId: "u", profile: { level: "SUPPORT", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(afterDemotion, "impersonate")).toBe(false);
  });
});

describe("canEndImpersonation — idempotent end", () => {
  it("is end-able when the session exists, belongs to the requester, and is not yet ended", () => {
    expect(canEndImpersonation({ adminUserId: "admin-1", endedAt: null }, "admin-1")).toBe(true);
  });

  it("is a no-op (false) when there is no such session — ending a nonexistent session must not throw", () => {
    expect(canEndImpersonation(null, "admin-1")).toBe(false);
  });

  it("is a no-op (false) when the session belongs to a different admin", () => {
    expect(canEndImpersonation({ adminUserId: "admin-2", endedAt: null }, "admin-1")).toBe(false);
  });

  it("is a no-op (false) when the session is already ended — repeated end calls stay idempotent, no double-log", () => {
    expect(canEndImpersonation({ adminUserId: "admin-1", endedAt: new Date() }, "admin-1")).toBe(false);
  });
});

describe("impersonation token — sign/verify round trip", () => {
  it("verifies a freshly signed, unexpired token and returns its payload", async () => {
    const payload = { sessionId: "session-1", expiresAt: Date.now() + IMPERSONATION_TTL_MS };
    const token = await signImpersonationToken(payload);
    const verified = await verifyImpersonationToken(token);
    expect(verified).toEqual(payload);
  });

  it("rejects a token whose embedded expiry has already passed — token-level expiry only, see the module's own doc comment for why this is not proof the DB session is still active", async () => {
    const payload = { sessionId: "session-1", expiresAt: Date.now() - 1 };
    const token = await signImpersonationToken(payload);
    expect(await verifyImpersonationToken(token)).toBeNull();
  });

  it("rejects null/undefined/empty input", async () => {
    expect(await verifyImpersonationToken(null)).toBeNull();
    expect(await verifyImpersonationToken(undefined)).toBeNull();
    expect(await verifyImpersonationToken("")).toBeNull();
  });

  it("rejects a tampered payload segment (signature no longer matches)", async () => {
    const payload = { sessionId: "session-1", expiresAt: Date.now() + IMPERSONATION_TTL_MS };
    const token = await signImpersonationToken(payload);
    const [payloadB64, signatureB64] = token.split(".");
    const tamperedPayload = `${payloadB64}xx.${signatureB64}`;
    expect(await verifyImpersonationToken(tamperedPayload)).toBeNull();
  });

  it("rejects a tampered signature segment", async () => {
    const payload = { sessionId: "session-1", expiresAt: Date.now() + IMPERSONATION_TTL_MS };
    const token = await signImpersonationToken(payload);
    const [payloadB64, signatureB64] = token.split(".");
    const tamperedSignature = `${payloadB64}.${signatureB64.slice(0, -2)}zz`;
    expect(await verifyImpersonationToken(tamperedSignature)).toBeNull();
  });

  it("rejects a token signed with a different secret (simulates a forged cookie)", async () => {
    const payload = { sessionId: "session-1", expiresAt: Date.now() + IMPERSONATION_TTL_MS };
    const originalSecret = process.env.AUTH_SECRET;

    process.env.AUTH_SECRET = "a-completely-different-secret";
    const forgedToken = await signImpersonationToken(payload);

    process.env.AUTH_SECRET = originalSecret;
    expect(await verifyImpersonationToken(forgedToken)).toBeNull();
  });

  it("rejects malformed tokens that don't have exactly two dot-separated segments", async () => {
    expect(await verifyImpersonationToken("not-a-token")).toBeNull();
    expect(await verifyImpersonationToken("a.b.c")).toBeNull();
  });
});
