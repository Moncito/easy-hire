import { describe, expect, it } from "vitest";
import { buildRoleRow, sortRoleRows } from "@/lib/employer/dashboard-roles";

const now = new Date("2026-09-30T12:00:00.000Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

const base = {
  id: "job_1",
  title: "Bookkeeper",
  location: "Philippines",
  remoteType: "REMOTE",
  targetHireCount: 1,
  views: 20,
  applicants: 4,
  pending: 0,
  oldestPendingAt: null as Date | null,
  hired: 0,
};

describe("buildRoleRow", () => {
  it("leaves the status empty for a healthy role and offers View applicants", () => {
    const row = buildRoleRow(base, true, now);
    expect(row.status).toBeNull();
    expect(row.primary).toEqual({ kind: "view", label: "View applicants", href: "/employer/jobs/job_1/applicants" });
    expect(row.meta).toBe("Philippines · Remote");
    expect(row.conversion).toBe(20);
  });

  it("flags pending applications, overdue only past the 14-day target, and makes Review primary", () => {
    const fresh = buildRoleRow({ ...base, pending: 1, oldestPendingAt: daysAgo(3) }, true, now);
    expect(fresh.status).toEqual({ kind: "needs-review", count: 1, overdue: false });
    expect(fresh.primary.kind).toBe("review");

    const stale = buildRoleRow({ ...base, pending: 2, oldestPendingAt: daysAgo(38) }, true, now);
    expect(stale.status).toEqual({ kind: "needs-review", count: 2, overdue: true });
  });

  it("flags a role with no applicants and offers Share listing once verified", () => {
    const row = buildRoleRow({ ...base, applicants: 0, views: 3 }, true, now);
    expect(row.status).toEqual({ kind: "no-applicants" });
    expect(row.primary).toEqual({ kind: "share", label: "Share listing", href: "/jobs/job_1" });
  });

  it("doesn't offer sharing a listing the public can't see yet", () => {
    const row = buildRoleRow({ ...base, applicants: 0 }, false, now);
    expect(row.primary.kind).toBe("view");
    expect(row.shareable).toBe(false);
  });

  it("withholds conversion under 10 views", () => {
    expect(buildRoleRow({ ...base, views: 9 }, true, now).conversion).toBeNull();
    expect(buildRoleRow({ ...base, views: 10, applicants: 1 }, true, now).conversion).toBe(10);
  });

  it("marks a role filled once hires reach the target", () => {
    expect(buildRoleRow({ ...base, hired: 1 }, true, now).filled).toBe(true);
    expect(buildRoleRow({ ...base, targetHireCount: 2, hired: 1 }, true, now).filled).toBe(false);
  });
});

describe("sortRoleRows", () => {
  it("puts roles needing review first, then the busiest", () => {
    const rows = sortRoleRows([
      buildRoleRow({ ...base, id: "a", title: "Quiet", applicants: 0 }, true, now),
      buildRoleRow({ ...base, id: "b", title: "Busy", applicants: 9 }, true, now),
      buildRoleRow({ ...base, id: "c", title: "Waiting", pending: 1, oldestPendingAt: daysAgo(2) }, true, now),
    ]);
    expect(rows.map((r) => r.title)).toEqual(["Waiting", "Busy", "Quiet"]);
  });
});
