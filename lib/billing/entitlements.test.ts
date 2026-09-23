import { describe, expect, it } from "vitest";
import { buildSoftCapJobWhere } from "@/lib/billing/entitlements";

describe("buildSoftCapJobWhere (Free-plan soft-cap liveness predicate)", () => {
  const now = new Date("2026-08-30T13:00:00.000Z");

  it("counts PENDING_REVIEW and ACTIVE jobs that are not expired", () => {
    expect(buildSoftCapJobWhere("company-1", { now })).toEqual({
      companyId: "company-1",
      status: { in: ["PENDING_REVIEW", "ACTIVE"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    });
  });

  it("keeps PENDING_REVIEW jobs counted via the expiresAt: null branch (they have no expiresAt yet)", () => {
    const where = buildSoftCapJobWhere("company-1", { now });
    expect(where.OR).toContainEqual({ expiresAt: null });
  });

  it("excludes a job past its expiresAt via the expiresAt: { gt: now } branch", () => {
    const where = buildSoftCapJobWhere("company-1", { now });
    expect(where.OR).toContainEqual({ expiresAt: { gt: now } });
  });

  it("adds an id-not-equal clause when excludeJobId is given, without disturbing the liveness predicate", () => {
    expect(buildSoftCapJobWhere("company-1", { now, excludeJobId: "job-9" })).toEqual({
      companyId: "company-1",
      status: { in: ["PENDING_REVIEW", "ACTIVE"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      id: { not: "job-9" },
    });
  });

  it("defaults `now` to the current time when not supplied", () => {
    const before = new Date();
    const where = buildSoftCapJobWhere("company-1");
    const after = new Date();
    const gt = (where.OR?.[1] as { expiresAt: { gt: Date } }).expiresAt.gt;
    expect(gt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(gt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
