import { describe, expect, it } from "vitest";
import {
  EMPTY_HIRING_DEFAULTS,
  hiringDefaultsToJobPrefill,
  parseStoredScreeningQuestions,
} from "@/lib/employer/hiring-defaults";
import { hiringDefaultsSchema } from "@/lib/validations/hiring-defaults";

describe("hiringDefaultsSchema", () => {
  it("turns blank text into null and fills omitted fields", () => {
    const parsed = hiringDefaultsSchema.parse({ location: "   ", rejectionMessage: "", applicantNote: " Hi " });
    expect(parsed).toEqual({ ...EMPTY_HIRING_DEFAULTS, applicantNote: "Hi" });
  });

  it("rejects role types and industries outside the job form's lists", () => {
    expect(hiringDefaultsSchema.safeParse({ category: "Astronaut" }).success).toBe(false);
    expect(hiringDefaultsSchema.safeParse({ industry: "Space" }).success).toBe(false);
  });

  it("enforces the job limits on screening questions", () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ prompt: `Q${i}`, required: true }));
    expect(hiringDefaultsSchema.safeParse({ screeningQuestions: six }).success).toBe(false);
    expect(hiringDefaultsSchema.safeParse({ screeningQuestions: [{ prompt: "x".repeat(301) }] }).success).toBe(false);
  });

  it("caps the rejection message at the reject dialog's 500 characters", () => {
    expect(hiringDefaultsSchema.safeParse({ rejectionMessage: "x".repeat(500) }).success).toBe(true);
    expect(hiringDefaultsSchema.safeParse({ rejectionMessage: "x".repeat(501) }).success).toBe(false);
  });
});

describe("parseStoredScreeningQuestions", () => {
  it("returns stored questions", () => {
    expect(parseStoredScreeningQuestions([{ prompt: "Why us?", required: false }])).toEqual([
      { prompt: "Why us?", required: false },
    ]);
  });

  it("returns no questions for malformed JSON instead of throwing", () => {
    expect(parseStoredScreeningQuestions({ not: "an array" })).toEqual([]);
    expect(parseStoredScreeningQuestions([{ text: "wrong key" }])).toEqual([]);
  });
});

describe("hiringDefaultsToJobPrefill", () => {
  it("returns nothing when there are no defaults, so the form's own fallbacks apply", () => {
    expect(hiringDefaultsToJobPrefill(EMPTY_HIRING_DEFAULTS, null)).toEqual({});
  });

  it("maps every set default", () => {
    const prefill = hiringDefaultsToJobPrefill(
      {
        ...EMPTY_HIRING_DEFAULTS,
        category: "Executive Assistant",
        employmentType: "PART_TIME",
        remoteType: "HYBRID",
        salaryPeriod: "HOURLY",
        location: "Cebu",
        screeningQuestions: [{ prompt: "Available weekends?", required: true }],
      },
      null
    );
    expect(prefill).toEqual({
      category: "Executive Assistant",
      employmentType: "PART_TIME",
      remoteType: "HYBRID",
      salaryPeriod: "HOURLY",
      location: "Cebu",
      screeningQuestions: [{ prompt: "Available weekends?", required: true }],
    });
  });

  it("falls back to the company's industry only when it's one of the form's options", () => {
    expect(hiringDefaultsToJobPrefill(EMPTY_HIRING_DEFAULTS, "Accounting")).toEqual({ industry: "Accounting" });
    expect(hiringDefaultsToJobPrefill(EMPTY_HIRING_DEFAULTS, "Widgets and more")).toEqual({});
  });

  it("prefers the default industry over the company's", () => {
    const prefill = hiringDefaultsToJobPrefill(
      { ...EMPTY_HIRING_DEFAULTS, industry: "Healthcare & Medical" },
      "Accounting"
    );
    expect(prefill.industry).toBe("Healthcare & Medical");
  });
});
