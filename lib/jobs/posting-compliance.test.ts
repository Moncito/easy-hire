import { describe, expect, it } from "vitest";
import { checkPostingCompliance, type ComplianceIssueCode } from "./posting-compliance";

function codes(description: string): ComplianceIssueCode[] {
  return checkPostingCompliance({ title: "Virtual Assistant", description }).map((i) => i.code);
}

describe("checkPostingCompliance — flags", () => {
  it.each([
    ["Applicants must be 22-30 years old", "AGE_REQUIREMENT"],
    ["Age: 25 to 35", "AGE_REQUIREMENT"],
    ["aged between 21 and 28", "AGE_REQUIREMENT"],
    ["30 years old and below only", "AGE_REQUIREMENT"],
    ["must be under 35 years old", "AGE_REQUIREMENT"],
    ["ideal candidate is 25 y/o", "AGE_REQUIREMENT"],
    ["Maximum age 40", "AGE_REQUIREMENT"],
    ["We want young professionals", "AGE_REQUIREMENT"],
    ["Female applicants preferred", "GENDER_REQUIREMENT"],
    ["Ladies only", "GENDER_REQUIREMENT"],
    ["must be a male", "GENDER_REQUIREMENT"],
    ["Gender: Female", "GENDER_REQUIREMENT"],
    ["Single applicants preferred", "CIVIL_STATUS"],
    ["no kids please", "CIVIL_STATUS"],
    ["With pleasing personality", "APPEARANCE"],
    ["Please attach a recent photo", "APPEARANCE"],
    ["Height: 5'4\" minimum", "APPEARANCE"],
    ["A small training fee is required", "APPLICANT_FEE"],
    ["Buy our starter kit to begin", "APPLICANT_FEE"],
    ["You need to pay ₱1,500 before onboarding", "APPLICANT_FEE"],
    ["refundable deposit of $50", "APPLICANT_FEE"],
    ["Include your SSS number in the application", "SENSITIVE_DATA"],
    ["Send your GCash details", "SENSITIVE_DATA"],
    ["We'll text you an OTP to confirm", "SENSITIVE_DATA"],
  ] as const)("%s → %s", (text, expected) => {
    expect(codes(text)).toContain(expected);
  });
});

describe("checkPostingCompliance — does not flag normal posts", () => {
  it.each([
    "3-5 years of experience in customer support",
    "Must be at least 18 years old",
    "18+ years of experience preferred",
    "Paid training during your first week",
    "Paid onboarding; we provide equipment",
    "Single point of contact for the client",
    "Experience with photo editing in Lightroom",
    "Passport not required",
    "Manage the men's apparel catalogue",
    "Available 9am-5pm EST, 40 hours per week, $6-8/hour",
    "Must have a valid TIN for invoicing",
  ])("%s", (text) => {
    expect(codes(text)).toEqual([]);
  });
});

describe("checkPostingCompliance — shape", () => {
  it("returns one issue per rule with an excerpt and guideline link", () => {
    const issues = checkPostingCompliance({
      title: "Admin VA",
      description: "Female only. Age 20-25. Female applicants preferred.",
    });
    expect(issues.map((i) => i.code)).toEqual(["AGE_REQUIREMENT", "GENDER_REQUIREMENT"]);
    expect(issues[0].excerpt).toContain("Age 20-25");
    expect(issues[0].guidelineHref).toBe("/job-posting-guidelines#fair-hiring");
  });

  it("scans requirements, benefits, and extra text", () => {
    expect(
      checkPostingCompliance({ title: "VA", requirements: "civil status: single", extra: ["What is your age limit?"] }).map(
        (i) => i.code
      )
    ).toEqual(["AGE_REQUIREMENT", "CIVIL_STATUS"]);
  });

  it("returns nothing for empty input", () => {
    expect(checkPostingCompliance({})).toEqual([]);
  });
});
