import { describe, expect, it } from "vitest";
import { CURRENT_TERMS_VERSION, hasAcceptedCurrentTerms, safeNextPath } from "@/lib/legal/terms-version";

describe("hasAcceptedCurrentTerms", () => {
  it("accepts only the current version", () => {
    expect(hasAcceptedCurrentTerms(CURRENT_TERMS_VERSION)).toBe(true);
    expect(hasAcceptedCurrentTerms("2000-01-01")).toBe(false);
    expect(hasAcceptedCurrentTerms(null)).toBe(false);
    expect(hasAcceptedCurrentTerms(undefined)).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/seeker/jobs?page=2", "/x")).toBe("/seeker/jobs?page=2");
  });
  it("falls back for missing or external-looking values", () => {
    expect(safeNextPath(null, "/x")).toBe("/x");
    expect(safeNextPath("", "/x")).toBe("/x");
    expect(safeNextPath("https://evil.com", "/x")).toBe("/x");
    expect(safeNextPath("//evil.com", "/x")).toBe("/x");
    expect(safeNextPath("/\\evil.com", "/x")).toBe("/x");
    expect(safeNextPath("seeker", "/x")).toBe("/x");
  });
  it("rejects the accept-terms page itself", () => {
    expect(safeNextPath("/accept-terms", "/x")).toBe("/x");
    expect(safeNextPath("/accept-terms?next=/a", "/x")).toBe("/x");
  });
  it("defaults the fallback to /", () => {
    expect(safeNextPath("//a")).toBe("/");
  });
});
