import { describe, expect, it } from "vitest";
import {
  buildApplicationsChart,
  buildPipelineFunnel,
  stageConversion,
} from "@/lib/employer/dashboard-pipeline";

const now = new Date(2026, 8, 30, 15, 0, 0);
const daysAgo = (n: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d;
};

describe("buildPipelineFunnel", () => {
  it("never increases down the stages", () => {
    const funnel = buildPipelineFunnel([
      { status: "APPLIED", history: [] },
      { status: "SHORTLISTED", history: ["APPLIED", "SHORTLISTED"] },
      { status: "INTERVIEW", history: [] },
      { status: "HIRED", history: [] },
      { status: "REJECTED", history: ["APPLIED", "INTERVIEW", "REJECTED"] },
    ]);
    expect(funnel).toMatchObject({ applied: 5, reviewed: 4, interviewed: 3, hired: 1 });
    expect(funnel.applied).toBeGreaterThanOrEqual(funnel.reviewed);
    expect(funnel.reviewed).toBeGreaterThanOrEqual(funnel.interviewed);
    expect(funnel.interviewed).toBeGreaterThanOrEqual(funnel.hired);
  });

  it("counts a rejection as reviewed, and flags it when there's no history to say how far it got", () => {
    const funnel = buildPipelineFunnel([{ status: "REJECTED", history: [] }]);
    expect(funnel).toEqual({ applied: 1, reviewed: 1, interviewed: 0, hired: 0, rejectedWithoutHistory: 1 });
  });

  it("keeps an application moved back to APPLIED counted as reviewed", () => {
    const funnel = buildPipelineFunnel([{ status: "APPLIED", history: ["APPLIED", "SHORTLISTED"] }]);
    expect(funnel.reviewed).toBe(1);
  });
});

describe("stageConversion", () => {
  it("rounds to a whole percent and is null for an empty previous stage", () => {
    expect(stageConversion(7, 6)).toBe(86);
    expect(stageConversion(0, 0)).toBeNull();
  });
});

describe("buildApplicationsChart", () => {
  it("builds one entry per day with weekday labels for 7 days", () => {
    const chart = buildApplicationsChart({
      applicationTimes: [daysAgo(0), daysAgo(0), daysAgo(3)],
      interviewTimes: [daysAgo(3)],
      viewsInRange: 30,
      range: 7,
      now,
    });
    expect(chart.days).toHaveLength(7);
    expect(chart.days[6]).toMatchObject({ label: "Wed", applications: 2, interviews: 0 });
    expect(chart.days[3]).toMatchObject({ applications: 1, interviews: 1 });
    expect(chart.total).toBe(3);
    expect(chart.busiestDay).toBe("Sep 30");
    expect(chart.viewToApplyRate).toBe(10);
  });

  it("withholds the view rate below 10 views and has no busiest day when empty", () => {
    const chart = buildApplicationsChart({
      applicationTimes: [],
      interviewTimes: [],
      viewsInRange: 9,
      range: 30,
      now,
    });
    expect(chart.total).toBe(0);
    expect(chart.busiestDay).toBeNull();
    expect(chart.viewToApplyRate).toBeNull();
    expect(chart.days[0].label).toBe("Sep 1");
  });
});
