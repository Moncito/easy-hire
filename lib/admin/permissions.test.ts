import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  ADMIN_PERMISSIONS,
  LOWEST_ADMIN_LEVEL,
  assertLastSuperAdminSafe,
  assertPermission,
  assertSelfTeamActionAllowed,
  defaultPermissionsForLevel,
  hasPermission,
  isAdminPermission,
  resolveAdminAccess,
  type AdminPermission,
} from "@/lib/admin/permissions";

describe("isAdminPermission — runtime whitelist", () => {
  it("accepts every value on the vocabulary", () => {
    for (const permission of ADMIN_PERMISSIONS) {
      expect(isAdminPermission(permission)).toBe(true);
    }
  });

  it("rejects an unrecognized string", () => {
    expect(isAdminPermission("not.a.real.permission")).toBe(false);
    expect(isAdminPermission("")).toBe(false);
  });
});

describe("resolveAdminAccess — bootstrap mode", () => {
  it("resolves any Role.ADMIN user to SUPER_ADMIN with every permission when the AdminProfile table has zero rows", () => {
    const access = resolveAdminAccess({ userId: "user-1", profile: null, totalAdminProfileCount: 0 });

    expect(access.isBootstrap).toBe(true);
    expect(access.level).toBe("SUPER_ADMIN");
    for (const permission of ADMIN_PERMISSIONS) {
      expect(access.permissions.has(permission)).toBe(true);
    }
  });

  it("bootstraps the same way even when this particular user happens to already have a profile-shaped object passed in — totalAdminProfileCount is what decides bootstrap, not the presence of `profile`", () => {
    // Defensive case: totalAdminProfileCount === 0 should be authoritative
    // even if a caller somehow passes a non-null profile alongside it (which
    // should never happen from loadResolvedAdminAccess's real query, since a
    // count of zero implies no row exists for anyone) — bootstrap still wins.
    const access = resolveAdminAccess({
      userId: "user-1",
      profile: { level: "SUPPORT", permissions: [] },
      totalAdminProfileCount: 0,
    });
    expect(access.isBootstrap).toBe(true);
    expect(access.level).toBe("SUPER_ADMIN");
  });
});

describe("resolveAdminAccess — post-bootstrap, no row for this admin", () => {
  it("resolves to the LOWEST level, never SUPER_ADMIN, once at least one AdminProfile row exists anywhere", () => {
    const access = resolveAdminAccess({ userId: "user-2", profile: null, totalAdminProfileCount: 1 });

    expect(access.isBootstrap).toBe(false);
    expect(access.level).toBe(LOWEST_ADMIN_LEVEL);
    expect(access.level).not.toBe("SUPER_ADMIN");
  });

  it("a missing-row admin gets exactly LOWEST_ADMIN_LEVEL's default permission set, nothing more", () => {
    const access = resolveAdminAccess({ userId: "user-2", profile: null, totalAdminProfileCount: 5 });
    const expected = new Set(defaultPermissionsForLevel(LOWEST_ADMIN_LEVEL));

    expect(access.permissions).toEqual(expected);
  });
});

describe("resolveAdminAccess — each level's default permission set", () => {
  it("SUPPORT gets user.read, user.support, document.view and nothing else", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "SUPPORT", permissions: [] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions).toEqual(new Set(["user.read", "user.support", "document.view"]));
  });

  it("MODERATOR gets queue.decide, user.read, document.view and nothing else", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "MODERATOR", permissions: [] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions).toEqual(new Set(["queue.decide", "user.read", "document.view"]));
  });

  it("FINANCE gets user.read, revenue.read, cost.read and nothing else", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "FINANCE", permissions: [] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions).toEqual(new Set(["user.read", "revenue.read", "cost.read"]));
  });

  it("SUPER_ADMIN gets every permission in the vocabulary, including the SUPER_ADMIN-only ones", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "SUPER_ADMIN", permissions: [] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions).toEqual(new Set(ADMIN_PERMISSIONS));
    expect(access.permissions.has("user.delete")).toBe(true);
    expect(access.permissions.has("team.manage")).toBe(true);
  });
});

describe("resolveAdminAccess — additive per-user grants", () => {
  it("adds a recognized permission on top of the level's defaults", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "SUPPORT", permissions: ["revenue.read"] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions.has("revenue.read")).toBe(true);
    // Level defaults are still present alongside the grant.
    expect(access.permissions.has("user.support")).toBe(true);
  });

  it("silently drops an unrecognized permission string rather than throwing or including it", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "SUPPORT", permissions: ["not.a.real.permission"] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions.has("not.a.real.permission" as AdminPermission)).toBe(false);
    expect(access.permissions.size).toBe(defaultPermissionsForLevel("SUPPORT").length);
  });

  it("refuses to grant a SUPER_ADMIN-only permission (user.delete) to a non-SUPER_ADMIN level even via an additive grant", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "MODERATOR", permissions: ["user.delete"] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions.has("user.delete")).toBe(false);
  });

  it("refuses to grant team.manage to a non-SUPER_ADMIN level even via an additive grant", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "FINANCE", permissions: ["team.manage"] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions.has("team.manage")).toBe(false);
  });

  it("a SUPER_ADMIN's own additive grants are a no-op for the two SUPER_ADMIN-only permissions since they're already included by the level default", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "SUPER_ADMIN", permissions: ["user.delete", "team.manage"] },
      totalAdminProfileCount: 1,
    });
    expect(access.permissions.has("user.delete")).toBe(true);
    expect(access.permissions.has("team.manage")).toBe(true);
  });
});

describe("hasPermission / assertPermission", () => {
  it("hasPermission reflects the resolved set", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "MODERATOR", permissions: [] },
      totalAdminProfileCount: 1,
    });
    expect(hasPermission(access, "queue.decide")).toBe(true);
    expect(hasPermission(access, "revenue.read")).toBe(false);
  });

  it("assertPermission throws a 403 ApiError when the permission is missing", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "MODERATOR", permissions: [] },
      totalAdminProfileCount: 1,
    });
    try {
      assertPermission(access, "revenue.read");
      expect.fail("expected assertPermission to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("assertPermission does not throw when the permission is present", () => {
    const access = resolveAdminAccess({
      userId: "u",
      profile: { level: "MODERATOR", permissions: [] },
      totalAdminProfileCount: 1,
    });
    expect(() => assertPermission(access, "queue.decide")).not.toThrow();
  });
});

describe("assertSelfTeamActionAllowed — self-escalation refused", () => {
  it("refuses a non-bootstrap self-targeted change, even nominally 'to the same level'", () => {
    expect(() =>
      assertSelfTeamActionAllowed({
        actorUserId: "admin-1",
        targetUserId: "admin-1",
        allowBootstrapSelfInit: false,
      })
    ).toThrow(ApiError);
  });

  it("refuses with a 403 so the API surfaces a clear forbidden, not a generic error", () => {
    try {
      assertSelfTeamActionAllowed({ actorUserId: "admin-1", targetUserId: "admin-1", allowBootstrapSelfInit: false });
      expect.fail("expected assertSelfTeamActionAllowed to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("allows a self-targeted change ONLY when the caller explicitly marks it as the narrow bootstrap self-init exception", () => {
    expect(() =>
      assertSelfTeamActionAllowed({
        actorUserId: "admin-1",
        targetUserId: "admin-1",
        allowBootstrapSelfInit: true,
      })
    ).not.toThrow();
  });

  it("never blocks a change targeted at someone other than the actor, bootstrap or not", () => {
    expect(() =>
      assertSelfTeamActionAllowed({
        actorUserId: "admin-1",
        targetUserId: "admin-2",
        allowBootstrapSelfInit: false,
      })
    ).not.toThrow();
  });

  it("even a SUPER_ADMIN actor is refused when self-targeted with no bootstrap exception — the caller decides the exception, this function does not special-case level", () => {
    expect(() =>
      assertSelfTeamActionAllowed({
        actorUserId: "super-admin-1",
        targetUserId: "super-admin-1",
        allowBootstrapSelfInit: false,
      })
    ).toThrow(ApiError);
  });
});

describe("assertLastSuperAdminSafe — last-super-admin demotion refused", () => {
  it("refuses a demotion when the target is the only SUPER_ADMIN (zero others)", () => {
    expect(() =>
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 0, operation: "demote" })
    ).toThrow(ApiError);
  });

  it("refuses with a 409 (conflict), not a generic 400/500", () => {
    try {
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 0, operation: "demote" });
      expect.fail("expected assertLastSuperAdminSafe to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
    }
  });

  it("allows a demotion when at least one other SUPER_ADMIN remains", () => {
    expect(() =>
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 1, operation: "demote" })
    ).not.toThrow();
  });

  it("never blocks changing a non-SUPER_ADMIN target, regardless of otherSuperAdminCount", () => {
    expect(() =>
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: false, otherSuperAdminCount: 0, operation: "demote" })
    ).not.toThrow();
  });
});

describe("assertLastSuperAdminSafe — last-super-admin deletion (revoke) refused", () => {
  it("refuses revoking the only remaining SUPER_ADMIN's profile", () => {
    expect(() =>
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 0, operation: "revoke" })
    ).toThrow(ApiError);
  });

  it("allows revoking a SUPER_ADMIN's profile when another SUPER_ADMIN still exists", () => {
    expect(() =>
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 2, operation: "revoke" })
    ).not.toThrow();
  });

  it("the refusal message reflects which operation was attempted", () => {
    try {
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 0, operation: "revoke" });
      expect.fail("expected assertLastSuperAdminSafe to throw");
    } catch (error) {
      expect((error as ApiError).message).toMatch(/revoked/i);
    }

    try {
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount: 0, operation: "demote" });
      expect.fail("expected assertLastSuperAdminSafe to throw");
    } catch (error) {
      expect((error as ApiError).message).toMatch(/demoted/i);
    }
  });
});

describe("defaultPermissionsForLevel", () => {
  it("is the single source of truth resolveAdminAccess itself reads from — every level's default is non-empty", () => {
    for (const level of ["SUPPORT", "MODERATOR", "FINANCE", "SUPER_ADMIN"] as const) {
      expect(defaultPermissionsForLevel(level).length).toBeGreaterThan(0);
    }
  });

  it("only SUPER_ADMIN's default set includes user.delete or team.manage", () => {
    for (const level of ["SUPPORT", "MODERATOR", "FINANCE"] as const) {
      const defaults = defaultPermissionsForLevel(level);
      expect(defaults).not.toContain("user.delete");
      expect(defaults).not.toContain("team.manage");
    }
    expect(defaultPermissionsForLevel("SUPER_ADMIN")).toContain("user.delete");
    expect(defaultPermissionsForLevel("SUPER_ADMIN")).toContain("team.manage");
  });
});
