import { describe, expect, it } from "vitest";
import { buildReportSeveritySignals, computeRankScore, QUEUE_RANKING } from "@/lib/admin/queues";

// Pure, DB-free — same convention as lib/admin/permissions.test.ts /
// lib/admin/impersonation.test.ts. lib/admin/queues.ts's DB-facing
// `listReportQueue` (and the other four list*Queue functions) are thin
// batched-fetch orchestration around exactly this kind of pure ranking
// primitive.

describe("buildReportSeveritySignals — REPORT kind's own severity inputs", () => {
  it("always includes a reportSeverity signal scaled by severityPerPoint", () => {
    const signals = buildReportSeveritySignals({ reportSeverity: 3, distinctReporterCount: 1, targetTrustScore: null });
    const reportSeveritySignal = signals.find((s) => s.key === "reportSeverity");
    expect(reportSeveritySignal).toBeDefined();
    expect(reportSeveritySignal!.contribution).toBe(3 * QUEUE_RANKING.severity.report.severityPerPoint);
  });

  it("a higher report severity contributes more than a lower one", () => {
    const low = buildReportSeveritySignals({ reportSeverity: 1, distinctReporterCount: 1, targetTrustScore: null });
    const high = buildReportSeveritySignals({ reportSeverity: 5, distinctReporterCount: 1, targetTrustScore: null });
    const sum = (signals: ReturnType<typeof buildReportSeveritySignals>) =>
      signals.reduce((s, sig) => s + sig.contribution, 0);
    expect(sum(high)).toBeGreaterThan(sum(low));
  });

  it("does NOT add a multipleReporters signal when this is the only reporter", () => {
    const signals = buildReportSeveritySignals({ reportSeverity: 2, distinctReporterCount: 1, targetTrustScore: null });
    expect(signals.some((s) => s.key === "multipleReporters")).toBe(false);
  });

  it("adds a multipleReporters signal scaled by (count - 1) * additionalReporterWeight once more than one reporter is present", () => {
    const signals = buildReportSeveritySignals({ reportSeverity: 2, distinctReporterCount: 4, targetTrustScore: null });
    const multi = signals.find((s) => s.key === "multipleReporters");
    expect(multi).toBeDefined();
    expect(multi!.contribution).toBe((4 - 1) * QUEUE_RANKING.severity.report.additionalReporterWeight);
  });

  it("does NOT add a lowTrustScore signal when the target's trustScore is null (missing signal is never a penalty)", () => {
    const signals = buildReportSeveritySignals({ reportSeverity: 2, distinctReporterCount: 1, targetTrustScore: null });
    expect(signals.some((s) => s.key === "lowTrustScore")).toBe(false);
  });

  it("does NOT add a lowTrustScore signal when the target's trustScore is at or above the shared threshold", () => {
    const signals = buildReportSeveritySignals({
      reportSeverity: 2,
      distinctReporterCount: 1,
      targetTrustScore: QUEUE_RANKING.severity.lowTrustScore.threshold,
    });
    expect(signals.some((s) => s.key === "lowTrustScore")).toBe(false);
  });

  it("adds the SHARED lowTrustScore signal (same weight as every other kind) when the target's trustScore is below the threshold", () => {
    const signals = buildReportSeveritySignals({
      reportSeverity: 2,
      distinctReporterCount: 1,
      targetTrustScore: QUEUE_RANKING.severity.lowTrustScore.threshold - 1,
    });
    const lowTrust = signals.find((s) => s.key === "lowTrustScore");
    expect(lowTrust).toBeDefined();
    expect(lowTrust!.contribution).toBe(QUEUE_RANKING.severity.lowTrustScore.weight);
  });
});

describe("REPORT ranking end-to-end via the shared computeRankScore (age/reach are identical across every kind, per the module's ranking formula)", () => {
  it("a report with more corroborating reporters ranks higher, all else equal", () => {
    const fewReporters = buildReportSeveritySignals({ reportSeverity: 3, distinctReporterCount: 1, targetTrustScore: null });
    const manyReporters = buildReportSeveritySignals({ reportSeverity: 3, distinctReporterCount: 5, targetTrustScore: null });

    const sumWithBaseline = (signals: ReturnType<typeof buildReportSeveritySignals>) =>
      QUEUE_RANKING.rank.baselineSeverity + signals.reduce((s, sig) => s + sig.contribution, 0);

    const scoreFew = computeRankScore(sumWithBaseline(fewReporters), 10, 2);
    const scoreMany = computeRankScore(sumWithBaseline(manyReporters), 10, 2);

    expect(scoreMany).toBeGreaterThan(scoreFew);
  });

  it("an older report (same severity/reach) ranks higher than a fresher one — age is shared across every kind, REPORT included", () => {
    const signals = buildReportSeveritySignals({ reportSeverity: 2, distinctReporterCount: 1, targetTrustScore: null });
    const severity = QUEUE_RANKING.rank.baselineSeverity + signals.reduce((s, sig) => s + sig.contribution, 0);

    const fresh = computeRankScore(severity, 1, 1);
    const old = computeRankScore(severity, 72, 1);

    expect(old).toBeGreaterThan(fresh);
  });
});
