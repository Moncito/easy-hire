import { describe, expect, it } from "vitest";
import { toSampledMetric, buildActiveSupplyDemand, getMoneyBand, type SampledMetric } from "@/lib/admin/home-dashboard";

/**
 * Guards the three purely-structural pieces of the `/admin` Home dashboard
 * that don't touch Prisma:
 *  - `toSampledMetric` — the single conversion point for the null-vs-zero
 *    discipline every Band 1 rate/median goes through (docs/ADMIN-CONSOLE-
 *    PLAN.md §4.1): a zero-sample metric must come back `null`, never a
 *    fabricated `0` that could be misread as "measured and it's zero."
 *  - `buildActiveSupplyDemand` — the one Band 1 number that IS always
 *    computable (a live count, not a rate needing a minimum sample), so it
 *    must never be null, only its ratio may be.
 *  - `getMoneyBand` — Band 2 must always return the `{ status: "blocked" }`
 *    shape; the type this returns is structurally incapable of carrying a
 *    fabricated MRR/ARPU/margin number.
 */

describe("toSampledMetric — null-vs-zero discipline", () => {
  it("returns null when sampleSize is 0, even if a value is somehow present", () => {
    expect(toSampledMetric(0.5, 0)).toBeNull();
    expect(toSampledMetric(0, 0)).toBeNull();
  });

  it("returns null when value is null, regardless of sampleSize", () => {
    expect(toSampledMetric(null, 10)).toBeNull();
  });

  it("returns a real 0 value (not null) once sampleSize is positive — zero is a measured answer, not missing data", () => {
    const result: SampledMetric = toSampledMetric(0, 5);
    expect(result).toEqual({ value: 0, sampleSize: 5 });
  });

  it("passes through a positive value and its sample size unchanged", () => {
    expect(toSampledMetric(0.42, 17)).toEqual({ value: 0.42, sampleSize: 17 });
  });

  it("rejects a negative sampleSize the same as zero (defensive — never a fabricated metric from a nonsensical count)", () => {
    expect(toSampledMetric(0.5, -1)).toBeNull();
  });
});

describe("buildActiveSupplyDemand — always computable, never null itself", () => {
  it("computes the ratio when there is at least one active job", () => {
    const result = buildActiveSupplyDemand(20, 4);
    expect(result).toEqual({ activeSeekers: 20, activeJobs: 4, ratio: 5 });
  });

  it("returns ratio: null (not Infinity or a fabricated number) when there are zero active jobs", () => {
    const result = buildActiveSupplyDemand(20, 0);
    expect(result.ratio).toBeNull();
    expect(result.activeSeekers).toBe(20);
    expect(result.activeJobs).toBe(0);
  });

  it("is honest about a pre-launch marketplace — small real counts, not padded or hidden", () => {
    const result = buildActiveSupplyDemand(8, 4);
    expect(result).toEqual({ activeSeekers: 8, activeJobs: 4, ratio: 2 });
  });

  it("handles zero seekers and zero jobs without throwing", () => {
    const result = buildActiveSupplyDemand(0, 0);
    expect(result).toEqual({ activeSeekers: 0, activeJobs: 0, ratio: null });
  });
});

describe("getMoneyBand — Band 2 always returns the blocked-status shape", () => {
  it("returns status: blocked with a reason naming Phase 6 / no payment provider", () => {
    const money = getMoneyBand();
    expect(money.status).toBe("blocked");
    expect(money.reason).toMatch(/Phase 6/);
    expect(money.reason).toMatch(/payment provider/i);
  });

  it("never has a numeric field — the type this constructs cannot be misread as a real MRR/ARPU/margin value", () => {
    const money = getMoneyBand();
    expect("value" in money).toBe(false);
    expect("mrr" in money).toBe(false);
    expect("arpu" in money).toBe(false);
  });

  it("is deterministic — calling it twice returns the same shape", () => {
    expect(getMoneyBand()).toEqual(getMoneyBand());
  });
});
