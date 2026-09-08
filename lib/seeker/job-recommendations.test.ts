import { describe, expect, it } from "vitest";
import {
  RECOMMENDATION_WEIGHTS,
  scoreJobForSeeker,
  type RecommendationJobInput,
  type RecommendationSeekerInput,
} from "@/lib/seeker/job-recommendations";

const NOW = new Date("2026-09-08T00:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Fixtures below are deliberately built so every component OTHER than the
 * one under test scores exactly 0 by default:
 *  - skills: [] (no usable skills -> 0)
 *  - headline: null -> 0
 *  - location: "Nowhereville" vs the job's "Manila, Philippines" (ONSITE,
 *    no substring overlap either direction) -> 0
 *  - desired salary far above the job's default salary -> the job's whole
 *    range sits strictly below it -> 0
 *  - availability "part time only" vs the job's default FULL_TIME -> 0
 *  - job dates 400 days old -> recency decayed to 0
 * This lets most tests assert exact scores instead of loose bounds.
 */
function isolatingSeeker(overrides: Partial<RecommendationSeekerInput> = {}): RecommendationSeekerInput {
  return {
    skills: [],
    headline: null,
    location: "Nowhereville",
    desiredSalaryMin: 900000,
    desiredSalaryMax: 950000,
    availability: "part time only",
    ...overrides,
  };
}

function isolatingJob(overrides: Partial<RecommendationJobInput> = {}): RecommendationJobInput {
  return {
    title: "Executive Assistant",
    description: "General admin support for a busy founder.",
    requirements: null,
    category: "Admin Support",
    location: "Manila, Philippines",
    remoteType: "ONSITE",
    employmentType: "FULL_TIME",
    salaryMin: 1000,
    salaryMax: 2000,
    salaryPeriod: "MONTHLY",
    publishedAt: new Date(NOW.getTime() - 400 * DAY_MS),
    createdAt: new Date(NOW.getTime() - 400 * DAY_MS),
    ...overrides,
  };
}

describe("scoreJobForSeeker", () => {
  it("scores a profile with zero overlap low, below the recommendation threshold", () => {
    const seeker = isolatingSeeker();
    const job = isolatingJob();

    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBeLessThan(25);
    expect(reasons).toEqual([]);
  });

  it("awards the full skills weight once 5+ of the seeker's skills are matched", () => {
    const seeker = isolatingSeeker({
      skills: ["Bookkeeping", "QuickBooks", "Xero", "Payroll", "Excel"],
    });
    const job = isolatingJob({
      title: "Bookkeeping Specialist",
      category: "Accounting",
      description: "Manage QuickBooks, Xero, Payroll, and Excel while doing full bookkeeping.",
    });

    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(RECOMMENDATION_WEIGHTS.skills);
    expect(reasons).toEqual(["Matches 5 of your skills: Bookkeeping, QuickBooks, Xero"]);
  });

  it("gives full skill credit to a seeker with only 2 listed skills when both match (min(5, length) denominator)", () => {
    const seeker = isolatingSeeker({ skills: ["Bookkeeping", "Xero"] });
    const job = isolatingJob({
      title: "Bookkeeping Specialist",
      category: "Accounting",
      description: "Manage the books using Xero for a small business.",
    });

    const { score } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(RECOMMENDATION_WEIGHTS.skills);
  });

  it("does not throw on regex-metacharacter skills and still matches them", () => {
    const seeker = isolatingSeeker({ skills: ["C++", "Node.js"] });
    const job = isolatingJob({
      title: "Backend Developer",
      category: "Software Development",
      description: "Looking for a developer proficient in C++ and Node.js services.",
    });

    expect(() => scoreJobForSeeker(seeker, job, NOW)).not.toThrow();
    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(RECOMMENDATION_WEIGHTS.skills);
    expect(reasons).toEqual(["Matches 2 of your skills: C++, Node.js"]);
  });

  it("respects word boundaries: 'SEO' does not match as a substring of an unrelated word, but does match as a whole word", () => {
    const seeker = isolatingSeeker({ skills: ["SEO"] });

    // "season" itself never contains the substring "seo" — the real trap for
    // a naive implementation is a compound word that DOES contain it, e.g.
    // "conseoquence". Word-boundary matching must reject that too.
    const noMatchJob = isolatingJob({
      title: "Tour Coordinator",
      category: "Travel Support",
      description: "Plan itineraries for tourists during the peak season, avoiding any conseoquence delays.",
    });
    const { score: noMatchScore, reasons: noMatchReasons } = scoreJobForSeeker(seeker, noMatchJob, NOW);
    expect(noMatchScore).toBe(0);
    expect(noMatchReasons).toEqual([]);

    const matchJob = isolatingJob({
      title: "SEO Specialist",
      category: "Marketing",
      description: "Own our SEO strategy end to end.",
    });
    const { score: matchScore, reasons: matchReasons } = scoreJobForSeeker(seeker, matchJob, NOW);
    expect(matchScore).toBe(RECOMMENDATION_WEIGHTS.skills);
    expect(matchReasons).toEqual(["Matches 1 of your skills: SEO"]);
  });

  it("awards the full location weight for REMOTE jobs regardless of seeker location", () => {
    const seeker = isolatingSeeker();
    const job = isolatingJob({ remoteType: "REMOTE" });

    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(RECOMMENDATION_WEIGHTS.location);
    expect(reasons).toEqual(["Fully remote"]);
  });

  it("gives full salary credit when the monthly-equivalent ranges overlap", () => {
    const seeker = isolatingSeeker({ desiredSalaryMin: 30000, desiredSalaryMax: 50000 });
    const job = isolatingJob({ salaryMin: 40000, salaryMax: 60000, salaryPeriod: "MONTHLY" });

    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(RECOMMENDATION_WEIGHTS.salary);
    expect(reasons).toEqual(["Pay range fits your target"]);
  });

  it("scores exactly 0 on salary when the job's whole range sits strictly below the seeker's minimum", () => {
    const seeker = isolatingSeeker({ desiredSalaryMin: 60000, desiredSalaryMax: 80000 });
    const job = isolatingJob({ salaryMin: 20000, salaryMax: 30000, salaryPeriod: "MONTHLY" });

    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(0);
    expect(reasons).toEqual([]);
  });

  it("gives half salary credit when the job states no salary at all", () => {
    const seeker = isolatingSeeker({ desiredSalaryMin: 30000, desiredSalaryMax: 50000 });
    const job = isolatingJob({ salaryMin: null, salaryMax: null });

    const { score } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(Math.round(RECOMMENDATION_WEIGHTS.salary / 2));
  });

  it("compares salary across periods correctly (ANNUAL job vs a MONTHLY-equivalent desired range)", () => {
    const seeker = isolatingSeeker({ desiredSalaryMin: 40000, desiredSalaryMax: 60000 });
    // 500,000-600,000/yr => ~41,667-50,000/mo, which overlaps 40,000-60,000/mo.
    const overlappingJob = isolatingJob({ salaryMin: 500000, salaryMax: 600000, salaryPeriod: "ANNUAL" });
    // 60,000-100,000/yr => 5,000-8,333/mo, well below the seeker's monthly minimum.
    const belowJob = isolatingJob({ salaryMin: 60000, salaryMax: 100000, salaryPeriod: "ANNUAL" });

    const overlapResult = scoreJobForSeeker(seeker, overlappingJob, NOW);
    const belowResult = scoreJobForSeeker(seeker, belowJob, NOW);

    expect(overlapResult.score).toBe(RECOMMENDATION_WEIGHTS.salary);
    expect(overlapResult.reasons).toEqual(["Pay range fits your target"]);
    expect(belowResult.score).toBe(0);
  });

  it("decays recency to 0 at 30+ days old and never goes negative", () => {
    const seeker = isolatingSeeker();
    const jobExactly30 = isolatingJob({
      publishedAt: new Date(NOW.getTime() - 30 * DAY_MS),
      createdAt: new Date(NOW.getTime() - 30 * DAY_MS),
    });
    const jobWayOld = isolatingJob(); // already 400 days old by default

    const result30 = scoreJobForSeeker(seeker, jobExactly30, NOW);
    const resultOld = scoreJobForSeeker(seeker, jobWayOld, NOW);

    expect(result30.score).toBe(0);
    expect(resultOld.score).toBe(0);
    expect(result30.reasons).toEqual([]);
    expect(resultOld.reasons).toEqual([]);
  });

  it("awards recency credit and a 'Posted N days ago' reason for a fresh job", () => {
    const seeker = isolatingSeeker();
    const job = isolatingJob({
      publishedAt: new Date(NOW.getTime() - 2 * DAY_MS),
      createdAt: new Date(NOW.getTime() - 2 * DAY_MS),
    });

    const { score, reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(score).toBe(Math.round(RECOMMENDATION_WEIGHTS.recency * (1 - 2 / 30)));
    expect(reasons).toEqual(["Posted 2 days ago"]);
  });

  it("falls back to createdAt when publishedAt is null for the recency anchor", () => {
    const seeker = isolatingSeeker();
    const job = isolatingJob({
      publishedAt: null,
      createdAt: new Date(NOW.getTime() - 1 * DAY_MS),
    });

    const { reasons } = scoreJobForSeeker(seeker, job, NOW);
    expect(reasons).toEqual(["Posted 1 day ago"]);
  });

  it("never emits a reason for a component that scored zero, and caps reasons at 3 even when more components match", () => {
    const seeker = isolatingSeeker({
      skills: ["Bookkeeping", "QuickBooks", "Xero", "Payroll", "Excel"],
      headline: "Senior Accounting Specialist For Remote Teams",
      desiredSalaryMin: 30000,
      desiredSalaryMax: 50000,
      availability: "Available full-time",
    });
    const job = isolatingJob({
      title: "Accounting Specialist",
      category: "Remote Work",
      description: "Manage QuickBooks, Xero, Payroll, and Excel while doing full bookkeeping.",
      remoteType: "REMOTE",
      employmentType: "FULL_TIME",
      salaryMin: 35000,
      salaryMax: 45000,
      salaryPeriod: "MONTHLY",
      publishedAt: new Date(NOW.getTime() - 5 * DAY_MS),
      createdAt: new Date(NOW.getTime() - 5 * DAY_MS),
    });

    const { reasons } = scoreJobForSeeker(seeker, job, NOW);

    // 6 components all score > 0 here (skills, headline, location, salary,
    // recency, availability) — only the top 3 by points (ties broken by a
    // fixed weight-order priority) should surface.
    expect(reasons).toEqual([
      "Matches 5 of your skills: Bookkeeping, QuickBooks, Xero",
      "Your headline matches this role",
      "Fully remote",
    ]);
    expect(reasons.length).toBeLessThanOrEqual(3);
  });

  it("marks a job with zero skill/headline overlap as NOT relevant even when it's remote, fresh, and salary-compatible", () => {
    const seeker = isolatingSeeker({
      skills: ["Graphic Design", "Illustration"],
      desiredSalaryMin: 30000,
      desiredSalaryMax: 50000,
    });
    const job = isolatingJob({
      title: "Bookkeeper",
      category: "Accounting",
      description: "QuickBooks reconciliation and payroll administration.",
      remoteType: "REMOTE",
      salaryMin: 35000,
      salaryMax: 45000,
      salaryPeriod: "MONTHLY",
      publishedAt: new Date(NOW.getTime() - 3 * DAY_MS),
      createdAt: new Date(NOW.getTime() - 3 * DAY_MS),
    });

    const { score, relevant } = scoreJobForSeeker(seeker, job, NOW);
    // Profile-independent components alone (remote location + overlapping
    // salary + recency) clear the score threshold, proving the threshold
    // alone is not a sufficient relevance gate.
    expect(score).toBeGreaterThanOrEqual(25);
    expect(relevant).toBe(false);
  });

  it("marks a job as relevant once at least one skill matches", () => {
    const seeker = isolatingSeeker({ skills: ["Bookkeeping"] });
    const job = isolatingJob({
      title: "Bookkeeping Specialist",
      category: "Accounting",
    });

    const { relevant } = scoreJobForSeeker(seeker, job, NOW);
    expect(relevant).toBe(true);
  });

  it("marks a job as relevant once the headline matches, even with no skill overlap", () => {
    const seeker = isolatingSeeker({ headline: "Senior Accounting Specialist" });
    const job = isolatingJob({ title: "Accounting Specialist", category: "Finance" });

    const { relevant } = scoreJobForSeeker(seeker, job, NOW);
    expect(relevant).toBe(true);
  });

  it("gives half availability credit when unset, full credit on a match, and 0 on a clear mismatch", () => {
    const job = isolatingJob({ employmentType: "FULL_TIME" });

    const noAvailability = scoreJobForSeeker(isolatingSeeker({ availability: null }), job, NOW);
    const matching = scoreJobForSeeker(isolatingSeeker({ availability: "Available full-time" }), job, NOW);
    const mismatch = scoreJobForSeeker(isolatingSeeker({ availability: "part time only" }), job, NOW);

    expect(matching.score).toBe(RECOMMENDATION_WEIGHTS.availability);
    expect(noAvailability.score).toBe(Math.round(RECOMMENDATION_WEIGHTS.availability / 2));
    expect(mismatch.score).toBe(0);
  });
});
