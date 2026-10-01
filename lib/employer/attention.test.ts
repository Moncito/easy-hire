import { describe, expect, it } from "vitest";
import { waitSeverity } from "@/lib/employer/attention";

describe("waitSeverity", () => {
  it("is routine under 3 days", () => {
    expect(waitSeverity(0)).toBe("none");
    expect(waitSeverity(2)).toBe("none");
  });

  it("is a reminder from 3 days through the 14-day target", () => {
    expect(waitSeverity(3)).toBe("attention");
    expect(waitSeverity(14)).toBe("attention");
  });

  it("is critical once the target is missed", () => {
    expect(waitSeverity(15)).toBe("critical");
    expect(waitSeverity(38)).toBe("critical");
  });

  it("treats a missing wait as nothing to flag", () => {
    expect(waitSeverity(null)).toBe("none");
    expect(waitSeverity(undefined)).toBe("none");
  });
});
