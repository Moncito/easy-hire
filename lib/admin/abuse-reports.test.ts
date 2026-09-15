import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { hasPermission, resolveAdminAccess } from "@/lib/admin/permissions";
import {
  ABUSE_TARGET_TYPES,
  ABUSE_REPORT_REASONS_BY_TARGET_TYPE,
  isAbuseTargetType,
  isValidAbuseReportReason,
  severityForReason,
  resolveAbuseReportDedup,
  assertAbuseReportTargetExists,
} from "@/lib/admin/abuse-reports";

// This suite follows lib/admin/permissions.test.ts's / lib/admin/impersonation.test.ts's
// convention: prefer pure, DB-free functions so the rules are unit-testable
// without a Prisma connection. lib/admin/abuse-reports.ts's DB-facing
// functions (fileAbuseReport/listAbuseReports/getAbuseReportDetail/
// resolveAbuseReport) are thin orchestration around exactly the pure
// predicates exercised below.

describe("isAbuseTargetType — runtime whitelist", () => {
  it("accepts every documented target type", () => {
    for (const targetType of ABUSE_TARGET_TYPES) {
      expect(isAbuseTargetType(targetType)).toBe(true);
    }
  });

  it("rejects an unrecognized string", () => {
    expect(isAbuseTargetType("SEEKER_PROFILE")).toBe(false);
    expect(isAbuseTargetType("")).toBe(false);
    expect(isAbuseTargetType("company")).toBe(false); // wrong case
  });
});

describe("reason vocabularies — one per target type", () => {
  it("every target type has a non-empty vocabulary with a fallback OTHER code", () => {
    for (const targetType of ABUSE_TARGET_TYPES) {
      const vocab = ABUSE_REPORT_REASONS_BY_TARGET_TYPE[targetType];
      expect(vocab.length).toBeGreaterThan(0);
      expect(vocab.some((entry) => entry.code === "OTHER")).toBe(true);
    }
  });

  it("USER and COMPANY share the exact same vocabulary (both are 'an account')", () => {
    expect(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.USER).toBe(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.COMPANY);
  });

  it("JOB, MESSAGE, and REVIEW each have their own distinct vocabulary", () => {
    expect(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.JOB).not.toBe(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.MESSAGE);
    expect(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.MESSAGE).not.toBe(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.REVIEW);
    expect(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.JOB).not.toBe(ABUSE_REPORT_REASONS_BY_TARGET_TYPE.REVIEW);
  });

  it("every severity is within the 1-5 range AbuseReport.severity is documented to use", () => {
    for (const targetType of ABUSE_TARGET_TYPES) {
      for (const entry of ABUSE_REPORT_REASONS_BY_TARGET_TYPE[targetType]) {
        expect(entry.severity).toBeGreaterThanOrEqual(1);
        expect(entry.severity).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe("isValidAbuseReportReason / severityForReason — reason-to-severity mapping", () => {
  it("accepts a real reason for its own target type and returns its documented severity", () => {
    expect(isValidAbuseReportReason("JOB", "SCAM_OR_UPFRONT_FEE")).toBe(true);
    expect(severityForReason("JOB", "SCAM_OR_UPFRONT_FEE")).toBe(5);
  });

  it("rejects a reason that belongs to a DIFFERENT target type's vocabulary", () => {
    // SCAM_OR_UPFRONT_FEE is a JOB reason, not an ACCOUNT (USER/COMPANY) one.
    expect(isValidAbuseReportReason("USER", "SCAM_OR_UPFRONT_FEE")).toBe(false);
  });

  it("rejects an unrecognized reason string outright", () => {
    expect(isValidAbuseReportReason("MESSAGE", "NOT_A_REAL_REASON")).toBe(false);
  });

  it("a more serious reason (SCAM_OR_FRAUD) scores higher than a low-severity one (OTHER) for the same target type", () => {
    expect(severityForReason("USER", "SCAM_OR_FRAUD")).toBeGreaterThan(severityForReason("USER", "OTHER"));
  });

  it("severityForReason never throws on an unrecognized (targetType, reason) pair — falls back to the lowest severity (1)", () => {
    expect(severityForReason("REVIEW", "NOT_A_REAL_REASON")).toBe(1);
  });
});

describe("resolveAbuseReportDedup — one OPEN report per reporter+target", () => {
  it("creates a new report when the reporter has no existing OPEN report against this target", () => {
    const outcome = resolveAbuseReportDedup({ existingOpenReport: null, newSeverity: 3 });
    expect(outcome).toEqual({ action: "create" });
  });

  it("bumps the existing OPEN report instead of creating a second one", () => {
    const outcome = resolveAbuseReportDedup({
      existingOpenReport: { id: "report-1", severity: 2 },
      newSeverity: 4,
    });
    expect(outcome).toEqual({ action: "bump", reportId: "report-1", severity: 4 });
  });

  it("bumping never LOWERS severity — takes the max of the existing and new severity", () => {
    const outcome = resolveAbuseReportDedup({
      existingOpenReport: { id: "report-1", severity: 5 },
      newSeverity: 1,
    });
    expect(outcome).toEqual({ action: "bump", reportId: "report-1", severity: 5 });
  });

  it("a follow-up filing at the SAME severity still bumps (idempotent), not a no-op distinct from create", () => {
    const outcome = resolveAbuseReportDedup({
      existingOpenReport: { id: "report-1", severity: 3 },
      newSeverity: 3,
    });
    expect(outcome).toEqual({ action: "bump", reportId: "report-1", severity: 3 });
  });
});

describe("assertAbuseReportTargetExists — refuses a nonexistent target", () => {
  it("throws a 404 ApiError when the target does not exist", () => {
    try {
      assertAbuseReportTargetExists(false, "JOB", "job-does-not-exist");
      expect.fail("expected assertAbuseReportTargetExists to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
      expect((error as ApiError).message).toMatch(/job-does-not-exist/);
    }
  });

  it("does not throw when the target exists", () => {
    expect(() => assertAbuseReportTargetExists(true, "JOB", "job-1")).not.toThrow();
  });
});

describe("resolveAbuseReport refuses without `queue.decide` (composed from lib/admin/permissions.ts's own pure primitives — the same rule requireAdminPermission enforces via the DB, same precedent as lib/admin/impersonation.test.ts's equivalent section)", () => {
  it("a SUPPORT-level admin does not have `queue.decide`", () => {
    const access = resolveAdminAccess({ userId: "u", profile: { level: "SUPPORT", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(access, "queue.decide")).toBe(false);
  });

  it("a FINANCE-level admin does not have `queue.decide`, even via an additive grant it isn't allowed to hold arbitrarily (still governed by the same effectivePermissions rules every permission uses)", () => {
    const access = resolveAdminAccess({ userId: "u", profile: { level: "FINANCE", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(access, "queue.decide")).toBe(false);
  });

  it("a MODERATOR-level admin has `queue.decide` — the level resolveAbuseReport is meant to allow through", () => {
    const access = resolveAdminAccess({ userId: "u", profile: { level: "MODERATOR", permissions: [] }, totalAdminProfileCount: 1 });
    expect(hasPermission(access, "queue.decide")).toBe(true);
  });
});
