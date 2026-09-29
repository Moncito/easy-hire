import { describe, expect, it } from "vitest";
import { buildDashboardAttention, formatResponseTime } from "@/lib/employer/dashboard-attention";
import type { EmployerAnalytics } from "@/lib/employer/analytics";

type Input = Pick<EmployerAnalytics, "metrics" | "unreadMessages" | "activeJobs">;

function input(overrides: {
  needsReview?: number;
  oldestUnreviewedAgeDays?: number | null;
  hasOverdueUnreviewed?: boolean;
  unreadMessages?: number;
  jobs?: Array<{ title: string; status: string; applicantCount: number }>;
} = {}): Input {
  return {
    metrics: {
      needsReview: overrides.needsReview ?? 0,
      oldestUnreviewedAgeDays: overrides.oldestUnreviewedAgeDays ?? null,
      hasOverdueUnreviewed: overrides.hasOverdueUnreviewed ?? false,
    } as EmployerAnalytics["metrics"],
    unreadMessages: overrides.unreadMessages ?? 0,
    activeJobs: (overrides.jobs ?? []) as EmployerAnalytics["activeJobs"],
  };
}

describe("buildDashboardAttention", () => {
  it("is empty when nothing needs doing", () => {
    expect(buildDashboardAttention(input())).toEqual([]);
  });

  it("states how long the oldest applicant has waited, and warns only when overdue", () => {
    const [fresh] = buildDashboardAttention(input({ needsReview: 1, oldestUnreviewedAgeDays: 2 }));
    expect(fresh.title).toBe("1 applicant waiting for review");
    expect(fresh.detail).toBe("Oldest has waited 2 days");
    expect(fresh.tone).toBe("neutral");

    const [stale] = buildDashboardAttention(
      input({ needsReview: 3, oldestUnreviewedAgeDays: 37, hasOverdueUnreviewed: true })
    );
    expect(stale.title).toBe("3 applicants waiting for review");
    expect(stale.tone).toBe("warning");
  });

  it("omits the wait detail for same-day applicants", () => {
    const [item] = buildDashboardAttention(input({ needsReview: 1, oldestUnreviewedAgeDays: 0 }));
    expect(item.detail).toBeNull();
  });

  it("counts only live roles with no applicants", () => {
    const items = buildDashboardAttention(
      input({
        jobs: [
          { title: "Bookkeeper", status: "ACTIVE", applicantCount: 0 },
          { title: "Draft", status: "PENDING_REVIEW", applicantCount: 0 },
          { title: "Busy", status: "ACTIVE", applicantCount: 4 },
        ],
      })
    );
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("1 live role with no applicants yet");
    expect(items[0].detail).toContain("Bookkeeper");
  });

  it("puts a stale review ahead of everything else", () => {
    const items = buildDashboardAttention(
      input({
        needsReview: 1,
        oldestUnreviewedAgeDays: 9,
        hasOverdueUnreviewed: true,
        unreadMessages: 2,
        jobs: [{ title: "A", status: "ACTIVE", applicantCount: 0 }],
      })
    );
    expect(items.map((i) => i.id)).toEqual(["needs-review", "unread-messages", "quiet-roles"]);
  });
});

describe("formatResponseTime", () => {
  it("returns null until there's a measured median", () => {
    expect(formatResponseTime(null)).toBeNull();
    expect(formatResponseTime(undefined)).toBeNull();
  });

  it("picks the unit by size", () => {
    expect(formatResponseTime(0)).toBe("1m");
    expect(formatResponseTime(45)).toBe("45m");
    expect(formatResponseTime(180)).toBe("3h");
    expect(formatResponseTime(24 * 60 * 2.1)).toBe("2.1d");
    expect(formatResponseTime(24 * 60 * 3)).toBe("3d");
    expect(formatResponseTime(24 * 60 * 14.4)).toBe("14d");
  });
});
