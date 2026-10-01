import { describe, expect, it } from "vitest";
import { buildDashboardInsights, parseDashboardRange } from "@/lib/employer/dashboard-insights";

const now = new Date("2026-09-30T12:00:00.000Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

const oldest = (days: number) => ({
  applicationId: "app_1",
  jobId: "job_1",
  seekerName: "Scaredy Hernandez",
  jobTitle: "For Testing New Schema",
  appliedAt: daysAgo(days),
});

describe("buildDashboardInsights", () => {
  it("returns nothing when no rule fires, so the card doesn't render", () => {
    expect(buildDashboardInsights({ oldestApplied: null, quietListing: null }, now)).toEqual([]);
  });

  it("flags an application only once it has waited more than 14 days", () => {
    expect(buildDashboardInsights({ oldestApplied: oldest(14), quietListing: null }, now)).toEqual([]);

    const [insight] = buildDashboardInsights({ oldestApplied: oldest(37), quietListing: null }, now);
    expect(insight.lead).toBe("Scaredy Hernandez has waited 37 days");
    expect(insight.rest).toBe(" for a decision on For Testing New Schema.");
    expect(insight.href).toBe("/employer/jobs/job_1/applicants?application=app_1");
    expect(insight.actionLabel).toBe("Open application");
  });

  it("describes a quiet listing with its real view count and links to its editor", () => {
    const [insight] = buildDashboardInsights(
      { oldestApplied: null, quietListing: { jobId: "job_2", title: "Bookkeeper", views: 1 } },
      now
    );
    expect(insight.lead).toBe("Bookkeeper has 1 view and no applicants.");
    expect(insight.href).toBe("/employer/jobs/job_2/edit");
  });

  it("never holds more than two rows, waiting applicant first", () => {
    const insights = buildDashboardInsights(
      { oldestApplied: oldest(20), quietListing: { jobId: "job_2", title: "Bookkeeper", views: 3 } },
      now
    );
    expect(insights.map((i) => i.id)).toEqual(["stale-application", "quiet-listing"]);
  });
});

describe("parseDashboardRange", () => {
  it("accepts 7, 30, and 60", () => {
    expect(parseDashboardRange("7")).toBe(7);
    expect(parseDashboardRange("30")).toBe(30);
    expect(parseDashboardRange("60")).toBe(60);
  });

  it("falls back to 30 for anything else", () => {
    expect(parseDashboardRange(undefined)).toBe(30);
    expect(parseDashboardRange("90")).toBe(30);
    expect(parseDashboardRange("abc")).toBe(30);
    expect(parseDashboardRange(["7", "60"])).toBe(7);
  });
});
