import { describe, expect, it } from "vitest";
import {
  RESPONSE_METRICS_GRACE_DAYS,
  RESPONSE_METRICS_MIN_SAMPLE,
  RESPONSE_METRICS_WINDOW_DAYS,
  RESPONSE_RATE_72H_WINDOW_HOURS,
  computeResponseMetrics,
  computeResponseRate72h,
  isFirstEmployerResponseTransition,
  type ResponseMetricsSample,
} from "@/lib/employer/response-metrics";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const NOW = new Date("2026-09-04T00:00:00.000Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

/** Applied `appliedHoursAgo` hours ago, responded `responseHoursAfter` hours after applying (or never). */
function hourlySample(appliedHoursAgo: number, responseHoursAfter: number | null): ResponseMetricsSample {
  const appliedAt = new Date(NOW.getTime() - appliedHoursAgo * HOUR_MS);
  return {
    appliedAt,
    firstEmployerResponseAt: responseHoursAfter === null ? null : new Date(appliedAt.getTime() + responseHoursAfter * HOUR_MS),
  };
}

/** Applied `appliedDaysAgo` days ago, responded `responseMinutesAfter` minutes after applying (or never). */
function sample(appliedDaysAgo: number, responseMinutesAfter: number | null): ResponseMetricsSample {
  const appliedAt = daysAgo(appliedDaysAgo);
  return {
    appliedAt,
    firstEmployerResponseAt:
      responseMinutesAfter === null ? null : new Date(appliedAt.getTime() + responseMinutesAfter * MINUTE_MS),
  };
}

describe("computeResponseMetrics — window/grace/sample constants", () => {
  it("is a 90-day window, a 7-day grace period, and a minimum sample of 5", () => {
    expect(RESPONSE_METRICS_WINDOW_DAYS).toBe(90);
    expect(RESPONSE_METRICS_GRACE_DAYS).toBe(7);
    expect(RESPONSE_METRICS_MIN_SAMPLE).toBe(5);
  });
});

describe("computeResponseMetrics — minimum sample gate", () => {
  it("returns nulls with the true sampleSize when below the minimum, even if every one responded", () => {
    const samples = [sample(30, 60), sample(20, 120), sample(10, 30)];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result).toEqual({ responseRate: null, medianResponseMinutes: null, sampleSize: 3 });
  });

  it("publishes once the qualifying sample reaches exactly the minimum", () => {
    const samples = [sample(30, 60), sample(20, 60), sample(15, 60), sample(10, 60), sample(8, 60)];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(100);
    expect(result.medianResponseMinutes).toBe(60);
  });
});

describe("computeResponseMetrics — 7-day grace period", () => {
  it("excludes a young (< 7 days old) unanswered application from the qualifying set entirely", () => {
    // 5 old, answered applications (qualify) + 1 young, unanswered application (must be excluded).
    const qualifying = [sample(30, 60), sample(29, 60), sample(28, 60), sample(27, 60), sample(26, 60)];
    const youngUnanswered = sample(3, null);
    const withoutYoung = computeResponseMetrics(qualifying, { now: NOW });
    const withYoung = computeResponseMetrics([...qualifying, youngUnanswered], { now: NOW });
    expect(withYoung.sampleSize).toBe(withoutYoung.sampleSize);
    expect(withYoung).toEqual(withoutYoung);
  });

  it("keeps a young (< 7 days old) application that WAS answered — speed evidence counts immediately", () => {
    const qualifying = [sample(30, 60), sample(29, 60), sample(28, 60), sample(27, 60)];
    const youngAnswered = sample(3, 15); // applied 3 days ago, answered 15 minutes later
    const result = computeResponseMetrics([...qualifying, youngAnswered], { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(100);
  });

  it("an unanswered application exactly at the 7-day grace boundary already qualifies — 'younger than 7 days' is a strict age comparison", () => {
    const qualifying = [sample(30, 60), sample(29, 60), sample(28, 60), sample(27, 60), sample(26, 60)];
    const atBoundary = sample(RESPONSE_METRICS_GRACE_DAYS, null);
    const result = computeResponseMetrics([...qualifying, atBoundary], { now: NOW });
    expect(result.sampleSize).toBe(6);
  });

  it("an unanswered application older than the grace period qualifies (and counts as a non-response)", () => {
    const qualifying = [sample(30, 60), sample(29, 60), sample(28, 60), sample(27, 60)];
    const pastGrace = sample(RESPONSE_METRICS_GRACE_DAYS + 1, null);
    const result = computeResponseMetrics([...qualifying, pastGrace], { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(80); // 4 of 5 responded
  });
});

describe("computeResponseMetrics — 90-day rolling window", () => {
  it("excludes applications older than 90 days from the qualifying set", () => {
    const withinWindow = [sample(89, 60), sample(50, 60), sample(30, 60), sample(20, 60), sample(10, 60)];
    const older = sample(RESPONSE_METRICS_WINDOW_DAYS + 1, 60);
    const result = computeResponseMetrics([...withinWindow, older], { now: NOW });
    expect(result.sampleSize).toBe(5);
  });

  it("includes an application exactly at the 90-day boundary", () => {
    const withinWindow = [sample(50, 60), sample(30, 60), sample(20, 60), sample(10, 60)];
    const atBoundary = sample(RESPONSE_METRICS_WINDOW_DAYS, 60);
    const result = computeResponseMetrics([...withinWindow, atBoundary], { now: NOW });
    expect(result.sampleSize).toBe(5);
  });
});

describe("computeResponseMetrics — median response time", () => {
  it("takes the true median (middle value) on an odd count of responded applications", () => {
    // Response times: 10, 20, 30 minutes → median is 20.
    const samples = [
      sample(30, 10),
      sample(29, 20),
      sample(28, 30),
      sample(27, 40), // pads sample size to the minimum
      sample(26, 50),
    ];
    const result = computeResponseMetrics(samples, { now: NOW });
    // sorted response minutes: 10, 20, 30, 40, 50 → median is the middle (30)
    expect(result.medianResponseMinutes).toBe(30);
  });

  it("averages the two middle values on an even count of responded applications", () => {
    // 6 responded applications → response minutes sorted: 10, 20, 30, 40, 50, 60
    // median = average of 30 and 40 = 35.
    const samples = [
      sample(60, 10),
      sample(50, 20),
      sample(40, 30),
      sample(30, 40),
      sample(20, 50),
      sample(10, 60),
    ];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.sampleSize).toBe(6);
    expect(result.medianResponseMinutes).toBe(35);
  });

  it("rounds a fractional median to the nearest whole minute", () => {
    // Response minutes sorted: 1, 5, 15, 30, 60, 90 → two middle values 15 and 30
    // average to 22.5, which should round to 23 (round-half-up).
    const samples = [sample(50, 1), sample(40, 5), sample(30, 15), sample(20, 30), sample(10, 60), sample(5, 90)];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.sampleSize).toBe(6);
    expect(result.medianResponseMinutes).toBe(23);
  });

  it("medianResponseMinutes is null when nobody responded, even once the sample gate is met", () => {
    const samples = [sample(30, null), sample(25, null), sample(20, null), sample(15, null), sample(10, null)];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.medianResponseMinutes).toBeNull();
  });
});

describe("computeResponseMetrics — responseRate", () => {
  it("is 100 when every qualifying application was responded to", () => {
    const samples = [sample(30, 10), sample(25, 20), sample(20, 30), sample(15, 40), sample(10, 50)];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.responseRate).toBe(100);
  });

  it("is 0 (not null) once the sample gate is met, when nobody responded", () => {
    const samples = [sample(30, null), sample(25, null), sample(20, null), sample(15, null), sample(10, null)];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(0);
    expect(result.responseRate).not.toBeNull();
  });

  it("rounds responseRate to the nearest whole percent (2 of 3 in a 6-sample qualifying set)", () => {
    // 4 responded out of 6 qualifying → 66.666...% → rounds to 67. Both
    // non-responders are past the 7-day grace period so they qualify as
    // genuine non-responses rather than being excluded as "still recent."
    const samples = [
      sample(30, 10),
      sample(25, 20),
      sample(20, 30),
      sample(15, 40),
      sample(10, null),
      sample(12, null),
    ];
    const result = computeResponseMetrics(samples, { now: NOW });
    expect(result.sampleSize).toBe(6);
    expect(result.responseRate).toBe(67);
  });
});

describe("computeResponseRate72h — window constant", () => {
  it("is a 72-hour window", () => {
    expect(RESPONSE_RATE_72H_WINDOW_HOURS).toBe(72);
  });
});

describe("computeResponseRate72h — null-vs-zero discipline (minimum sample gate)", () => {
  it("returns null (not 0) with sampleSize 0 when there are no applications at all", () => {
    const result = computeResponseRate72h([], { now: NOW });
    expect(result).toEqual({ responseRate: null, sampleSize: 0 });
  });

  it("returns null with the true sampleSize when below the minimum, even if every one responded within 72h", () => {
    const samples = [hourlySample(80, 10), hourlySample(75, 20), hourlySample(73, 30)];
    const result = computeResponseRate72h(samples, { now: NOW });
    expect(result).toEqual({ responseRate: null, sampleSize: 3 });
  });

  it("publishes a real rate once the qualifying sample reaches RESPONSE_METRICS_MIN_SAMPLE", () => {
    const samples = [
      hourlySample(80, 10),
      hourlySample(75, 20),
      hourlySample(73, 30),
      hourlySample(90, 5),
      hourlySample(100, 1),
    ];
    const result = computeResponseRate72h(samples, { now: NOW });
    expect(result.sampleSize).toBe(RESPONSE_METRICS_MIN_SAMPLE);
    expect(result.responseRate).toBe(1);
  });
});

describe("computeResponseRate72h — undetermined (< 72h old, unanswered) applications are excluded entirely", () => {
  it("excludes a fresh unanswered application from both numerator and denominator", () => {
    const determined = [hourlySample(200, 10), hourlySample(150, 20), hourlySample(120, 30), hourlySample(110, 40), hourlySample(90, 50)];
    const fresh = hourlySample(10, null); // applied 10h ago, no response yet — still inside the 72h window
    const withoutFresh = computeResponseRate72h(determined, { now: NOW });
    const withFresh = computeResponseRate72h([...determined, fresh], { now: NOW });
    expect(withFresh).toEqual(withoutFresh);
  });

  it("a fresh application that WAS answered within 72h is immediately determined (a known 'yes'), unlike an unanswered one", () => {
    const determined = [hourlySample(200, 10), hourlySample(150, 20), hourlySample(120, 30), hourlySample(110, 40)];
    const freshAnswered = hourlySample(5, 1); // applied 5h ago, answered 1h later
    const result = computeResponseRate72h([...determined, freshAnswered], { now: NOW });
    expect(result.sampleSize).toBe(5);
  });
});

describe("computeResponseRate72h — the 72h boundary itself", () => {
  it("counts a response that took exactly 72h as within the window (inclusive)", () => {
    const samples = [
      hourlySample(200, RESPONSE_RATE_72H_WINDOW_HOURS),
      hourlySample(150, 1),
      hourlySample(120, 1),
      hourlySample(110, 1),
      hourlySample(90, 1),
    ];
    const result = computeResponseRate72h(samples, { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(1);
  });

  it("counts a response that took just over 72h as a non-response (still determined, since it already happened)", () => {
    const samples = [
      hourlySample(200, RESPONSE_RATE_72H_WINDOW_HOURS + 1),
      hourlySample(150, 1),
      hourlySample(120, 1),
      hourlySample(110, 1),
      hourlySample(90, 1),
    ];
    const result = computeResponseRate72h(samples, { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(0.8); // 4 of 5 within window
  });

  it("an unanswered application exactly at the 72h mark is already determined (a known non-response), not undetermined", () => {
    const answered = [hourlySample(150, 1), hourlySample(120, 1), hourlySample(110, 1), hourlySample(90, 1)];
    const atBoundary = hourlySample(RESPONSE_RATE_72H_WINDOW_HOURS, null);
    const result = computeResponseRate72h([...answered, atBoundary], { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(0.8);
  });
});

describe("computeResponseRate72h — result is a fraction (0..1), matching fillRate's convention, not a percentage", () => {
  it("returns 1 (not 100) when every determined application responded within window", () => {
    const samples = [hourlySample(200, 1), hourlySample(150, 1), hourlySample(120, 1), hourlySample(110, 1), hourlySample(90, 1)];
    const result = computeResponseRate72h(samples, { now: NOW });
    expect(result.responseRate).toBe(1);
  });

  it("returns 0 (not null) once the sample gate is met, when nobody responded in time", () => {
    const samples = [
      hourlySample(200, null),
      hourlySample(150, null),
      hourlySample(120, null),
      hourlySample(110, null),
      hourlySample(90, null),
    ];
    const result = computeResponseRate72h(samples, { now: NOW });
    expect(result.sampleSize).toBe(5);
    expect(result.responseRate).toBe(0);
    expect(result.responseRate).not.toBeNull();
  });
});

describe("isFirstEmployerResponseTransition — stamp-once decision shared by both status-transition sites", () => {
  it("stamps when the status moves off APPLIED for the first time", () => {
    expect(isFirstEmployerResponseTransition("APPLIED", "SHORTLISTED", false)).toBe(true);
    expect(isFirstEmployerResponseTransition("APPLIED", "REJECTED", false)).toBe(true);
    expect(isFirstEmployerResponseTransition("APPLIED", "HIRED", false)).toBe(true);
  });

  it("does not stamp when already stamped, even on a further status change", () => {
    expect(isFirstEmployerResponseTransition("SHORTLISTED", "INTERVIEW", true)).toBe(false);
  });

  it("does not stamp when the status did not move off APPLIED (no status change submitted)", () => {
    expect(isFirstEmployerResponseTransition("APPLIED", undefined, false)).toBe(false);
  });

  it("does not stamp a transition that did not start at APPLIED — only the move off APPLIED itself counts as the first response", () => {
    expect(isFirstEmployerResponseTransition("SHORTLISTED", "HIRED", false)).toBe(false);
  });
});
