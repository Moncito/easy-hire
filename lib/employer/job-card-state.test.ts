import { describe, expect, it } from "vitest";
import { jobCardState, overdueSummary } from "@/lib/employer/job-card-state";

const now = new Date("2026-09-30T12:00:00.000Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

const base = {
  id: "job_1",
  status: "ACTIVE",
  reviewRejectionReason: null as string | null,
  unreviewedCount: 0,
  oldestUnreviewedAt: null as string | null,
  applicantCount: 3,
};

describe("jobCardState", () => {
  it("gives a healthy active job no waiting state and a marigold View applicants", () => {
    const s = jobCardState(base, true, now);
    expect(s.lifecycle).toBe("active");
    expect(s.waiting).toBeNull();
    expect(s.primary).toMatchObject({ kind: "view", emphasis: "primary" });
    expect(s.isPublic).toBe(true);
  });

  it("applies the two-level wait rule to unreviewed applicants", () => {
    const fresh = jobCardState({ ...base, unreviewedCount: 1, oldestUnreviewedAt: daysAgo(1) }, true, now);
    expect(fresh.waiting).toEqual({ count: 1, days: 1, severity: "none" });
    expect(fresh.primary).toMatchObject({ kind: "review", emphasis: "primary" });

    const waiting = jobCardState({ ...base, unreviewedCount: 2, oldestUnreviewedAt: daysAgo(5) }, true, now);
    expect(waiting.waiting?.severity).toBe("attention");

    const overdue = jobCardState({ ...base, unreviewedCount: 1, oldestUnreviewedAt: daysAgo(38) }, true, now);
    expect(overdue.waiting).toEqual({ count: 1, days: 38, severity: "critical" });
  });

  it("offers Share listing for a public job with no applicants, but not before verification", () => {
    expect(jobCardState({ ...base, applicantCount: 0 }, true, now).primary.kind).toBe("share");
    const unlisted = jobCardState({ ...base, applicantCount: 0 }, false, now);
    expect(unlisted.lifecycle).toBe("unlisted");
    expect(unlisted.primary.kind).toBe("view");
    expect(unlisted.isPublic).toBe(false);
  });

  it("maps drafts, sent-back drafts, pending and closed listings", () => {
    expect(jobCardState({ ...base, status: "DRAFT" }, true, now)).toMatchObject({
      lifecycle: "draft",
      primary: { kind: "edit", emphasis: "primary" },
    });
    expect(jobCardState({ ...base, status: "DRAFT", reviewRejectionReason: "Add a salary" }, true, now).lifecycle).toBe(
      "revision"
    );
    expect(jobCardState({ ...base, status: "PENDING_REVIEW" }, true, now).primary.kind).toBe("submission");
    const closed = jobCardState({ ...base, status: "CLOSED", unreviewedCount: 2, oldestUnreviewedAt: daysAgo(30) }, true, now);
    expect(closed.primary.kind).toBe("archive");
    // A closed listing no longer nags about waiting applicants.
    expect(closed.waiting).toBeNull();
  });
});

describe("overdueSummary", () => {
  it("is null until a wait passes 14 days, then names the longest one", () => {
    const job = (id: string, days: number | null, status = "ACTIVE") => ({
      ...base,
      id,
      title: `Job ${id}`,
      status,
      unreviewedCount: days === null ? 0 : 1,
      oldestUnreviewedAt: days === null ? null : daysAgo(days),
    });
    expect(overdueSummary([job("a", 5), job("b", null)], true, now)).toBeNull();
    expect(overdueSummary([job("a", 20), job("b", 38), job("c", 5), job("d", 60, "CLOSED")], true, now)).toEqual({
      jobCount: 2,
      oldest: { jobId: "b", title: "Job b", days: 38 },
    });
  });
});