import { describe, expect, it } from "vitest";
import {
  percentChange,
  computeHiringScore,
  computeProfileCompletion,
  computeOldestUnreviewedAgeDays,
  isOverdueUnreviewed,
  OVERDUE_REVIEW_DAYS,
} from "@/lib/employer/analytics";
import {
  formatReviewRate,
  formatHireRate,
  isSparseReports,
} from "@/lib/employer/reports-helpers";
import type { EmployerAnalytics } from "@/lib/employer/analytics";

// ---------------------------------------------------------------------------
// percentChange
// ---------------------------------------------------------------------------

describe("percentChange", () => {
  it("returns null when combined total is below minTotal", () => {
    expect(percentChange(1, 1, 3)).toBeNull(); // 1+1=2 < 3
    expect(percentChange(0, 0, 3)).toBeNull();
  });

  it("returns 100 when previous=0 and current>0 (any minTotal met)", () => {
    expect(percentChange(5, 0, 3)).toBe(100); // 5+0=5 >= 3
  });

  it("returns null when both are 0 regardless of minTotal", () => {
    // 0+0=0 < any positive minTotal
    expect(percentChange(0, 0, 1)).toBeNull();
  });

  it("returns null when previous=0 and current=0 edge case", () => {
    // previous===0 branch returns null when current is also 0
    expect(percentChange(0, 0, 0)).toBeNull();
  });

  it("computes positive change correctly", () => {
    expect(percentChange(10, 5, 3)).toBe(100); // (10-5)/5 * 100 = 100
    expect(percentChange(15, 10, 3)).toBe(50);  // (15-10)/10 * 100 = 50
  });

  it("computes negative change correctly", () => {
    expect(percentChange(3, 6, 3)).toBe(-50); // (3-6)/6 * 100 = -50
  });

  it("rounds to integer", () => {
    expect(percentChange(7, 3, 3)).toBe(133); // 133.33... → 133
  });

  it("respects custom minTotal=2 (used for appsToday)", () => {
    // appsToday uses minTotal=2
    expect(percentChange(1, 0, 2)).toBeNull(); // 1+0=1 < 2
    expect(percentChange(1, 1, 2)).toBe(0);    // 1+1=2 >= 2; (1-1)/1=0
  });
});

// ---------------------------------------------------------------------------
// computeProfileCompletion
// ---------------------------------------------------------------------------

describe("computeProfileCompletion", () => {
  const base = {
    companyName: "Acme",
    description: "We do things",
    industry: "Tech",
    logoUrl: "https://example.com/logo.png",
    linkedinUrl: "https://linkedin.com/company/acme",
    facebookUrl: null,
    instagramUrl: null,
    xUrl: null,
    highlights: ["Great culture"],
  };

  it("returns 100 when all 6 checklist items are present", () => {
    expect(computeProfileCompletion(base)).toBe(100);
  });

  it("returns 0 for a completely empty profile", () => {
    expect(
      computeProfileCompletion({
        companyName: "",
        description: null,
        industry: null,
        logoUrl: null,
        linkedinUrl: null,
        facebookUrl: null,
        instagramUrl: null,
        xUrl: null,
        highlights: [],
      })
    ).toBe(0);
  });

  it("counts any one social link as satisfying the social checklist item", () => {
    const withFb = { ...base, linkedinUrl: null, facebookUrl: "https://fb.com/acme" };
    expect(computeProfileCompletion(withFb)).toBe(100);
  });

  it("returns 83 (5/6) when highlights are missing", () => {
    expect(computeProfileCompletion({ ...base, highlights: [] })).toBe(83);
  });

  it("returns 83 (5/6) when logo is missing", () => {
    expect(computeProfileCompletion({ ...base, logoUrl: null })).toBe(83);
  });

  it("returns 67 (4/6) when both logo and highlights are missing", () => {
    expect(computeProfileCompletion({ ...base, logoUrl: null, highlights: [] })).toBe(67);
  });
});

// ---------------------------------------------------------------------------
// computeHiringScore
// ---------------------------------------------------------------------------

describe("computeHiringScore", () => {
  it("returns 0 for a brand-new company with no jobs or applicants", () => {
    expect(
      computeHiringScore({
        profileCompletion: 0,
        totalApplicants: 0,
        reviewedCount: 0,
        interviewCount: 0,
        hiredCount: 0,
        activeJobsWithApplicants: 0,
        activeJobs: 0,
      })
    ).toBe(0);
  });

  it("awards up to 20 points for profile completion", () => {
    const score = computeHiringScore({
      profileCompletion: 100,
      totalApplicants: 0,
      reviewedCount: 0,
      interviewCount: 0,
      hiredCount: 0,
      activeJobsWithApplicants: 0,
      activeJobs: 0,
    });
    expect(score).toBe(20);
  });

  it("awards 30 points for 100% review rate", () => {
    // profile=0 → 0pts; reviewRate=1 → 30pts; pipeline→12pts (reviewed>0, no interview/hire)
    const score = computeHiringScore({
      profileCompletion: 0,
      totalApplicants: 10,
      reviewedCount: 10,
      interviewCount: 0,
      hiredCount: 0,
      activeJobsWithApplicants: 0,
      activeJobs: 0,
    });
    expect(score).toBe(42); // 0 + 30 + 12 + 0
  });

  it("awards 25 pipeline points when interviews > 0", () => {
    const score = computeHiringScore({
      profileCompletion: 0,
      totalApplicants: 10,
      reviewedCount: 5,
      interviewCount: 3,
      hiredCount: 0,
      activeJobsWithApplicants: 0,
      activeJobs: 0,
    });
    // reviewPoints = round(0.5*30) = 15; pipelinePoints = 25
    expect(score).toBe(40); // 0 + 15 + 25 + 0
  });

  it("caps score at 100", () => {
    const score = computeHiringScore({
      profileCompletion: 100,
      totalApplicants: 100,
      reviewedCount: 100,
      interviewCount: 50,
      hiredCount: 10,
      activeJobsWithApplicants: 5,
      activeJobs: 5,
    });
    expect(score).toBe(100);
  });

  it("awards 25 activity points when all active jobs have applicants", () => {
    const score = computeHiringScore({
      profileCompletion: 0,
      totalApplicants: 0,
      reviewedCount: 0,
      interviewCount: 0,
      hiredCount: 0,
      activeJobsWithApplicants: 4,
      activeJobs: 4,
    });
    expect(score).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// overdue unreviewed review severity
// ---------------------------------------------------------------------------

describe("computeOldestUnreviewedAgeDays", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");

  it("returns null when there is no oldest application", () => {
    expect(computeOldestUnreviewedAgeDays(null, now)).toBeNull();
    expect(computeOldestUnreviewedAgeDays(undefined, now)).toBeNull();
  });

  it("returns 0 for applications from the same moment", () => {
    expect(computeOldestUnreviewedAgeDays(now, now)).toBe(0);
  });

  it("floors partial days", () => {
    const appliedAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 - 60_000);
    expect(computeOldestUnreviewedAgeDays(appliedAt, now)).toBe(5);
  });
});

describe("isOverdueUnreviewed", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");
  const thresholdMs = OVERDUE_REVIEW_DAYS * 24 * 60 * 60 * 1000;

  it("returns false when there is no oldest application", () => {
    expect(isOverdueUnreviewed(null, now)).toBe(false);
  });

  it("returns false at exactly the threshold boundary", () => {
    const appliedAt = new Date(now.getTime() - thresholdMs);
    expect(isOverdueUnreviewed(appliedAt, now)).toBe(false);
  });

  it("returns true one millisecond past the threshold", () => {
    const appliedAt = new Date(now.getTime() - thresholdMs - 1);
    expect(isOverdueUnreviewed(appliedAt, now)).toBe(true);
  });

  it("returns false for a fresh application", () => {
    const appliedAt = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(isOverdueUnreviewed(appliedAt, now)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatReviewRate — reports-helpers
// ---------------------------------------------------------------------------

describe("formatReviewRate", () => {
  const baseFunnel: EmployerAnalytics["funnel"] = {
    applied: 2,
    reviewed: 3,
    interview: 1,
    hired: 0,
  };

  it('returns "—" hint when totalApplicants < 5', () => {
    const result = formatReviewRate(baseFunnel, 4);
    expect(result.value).toBe("—");
    expect(result.hint).toMatch(/5\+/);
  });

  it("computes review rate as (total - applied) / total", () => {
    // total=10, applied=2 → reviewed=8 → 80%
    const funnel = { applied: 2, reviewed: 8, interview: 3, hired: 1 };
    const result = formatReviewRate(funnel, 10);
    expect(result.value).toBe("80%");
    expect(result.hint).toBe("8 of 10 reviewed");
  });

  it("returns 100% when no applications are still in APPLIED status", () => {
    const funnel = { applied: 0, reviewed: 10, interview: 5, hired: 2 };
    const result = formatReviewRate(funnel, 10);
    expect(result.value).toBe("100%");
  });
});

// ---------------------------------------------------------------------------
// formatHireRate — reports-helpers
// ---------------------------------------------------------------------------

describe("formatHireRate", () => {
  it('returns "—" hint with sparse data and no hires', () => {
    const funnel = { applied: 2, reviewed: 1, interview: 0, hired: 0 };
    const result = formatHireRate(funnel, 3);
    expect(result.value).toBe("—");
  });

  it("shows hire count when sparse but some were hired", () => {
    const funnel = { applied: 1, reviewed: 2, interview: 1, hired: 1 };
    const result = formatHireRate(funnel, 4); // 4 < MIN_SAMPLE_FOR_RATES=5
    expect(result.value).toBe("1 hired");
  });

  it("computes hire rate as hired / totalApplicants when sample is sufficient", () => {
    const funnel = { applied: 5, reviewed: 5, interview: 3, hired: 2 };
    const result = formatHireRate(funnel, 10);
    expect(result.value).toBe("20%");
    expect(result.hint).toBe("2 hired total");
  });
});

// ---------------------------------------------------------------------------
// isSparseReports — reports-helpers
// ---------------------------------------------------------------------------

describe("isSparseReports", () => {
  function makeAnalytics(
    totalApplicants: number,
    weeklyAppCount: number
  ): EmployerAnalytics {
    const days = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-08-${String(i + 11).padStart(2, "0")}`,
      count: i === 3 ? weeklyAppCount : 0,
    }));
    return {
      hiringScore: 50,
      scorePercentile: null,
      funnel: { applied: totalApplicants, reviewed: 0, interview: 0, hired: 0 },
      metrics: {
        activeJobs: 1,
        totalApplicants,
        needsReview: 0,
        oldestUnreviewedAgeDays: null,
        hasOverdueUnreviewed: false,
        appsToday: 0,
        appsTodayChange: null,
        interviewsActive: 0,
        interviewsChange: null,
        appsTodaySparkline: [],
        interviewsSparkline: [],
      },
      weeklyTrend: { applications: days, interviews: days.map((d) => ({ ...d, count: 0 })) },
      insights: { actionRequired: null, marketInsight: null },
      activeJobs: [],
      profileCompletion: 100,
      newApplicantsThisWeek: weeklyAppCount,
      companyVerified: true,
      unreadMessages: 0,
      attentionItems: [],
      recentActivity: [],
    };
  }

  it("is sparse when totalApplicants < 5", () => {
    expect(isSparseReports(makeAnalytics(4, 4))).toBe(true);
  });

  it("is sparse when weekly totals are all zero", () => {
    expect(isSparseReports(makeAnalytics(10, 0))).toBe(true);
  });

  it("is NOT sparse with 5+ applicants and non-zero weekly activity", () => {
    expect(isSparseReports(makeAnalytics(5, 3))).toBe(false);
  });
});
