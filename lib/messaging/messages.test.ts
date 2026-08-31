import { describe, expect, it } from "vitest";
import { seekerCanMessageCompany } from "@/lib/messages";

describe("seekerCanMessageCompany", () => {
  it("allows messaging a company the seeker has applied to (no jobId in payload)", () => {
    expect(seekerCanMessageCompany(["job-1", "job-2"])).toBe(true);
  });

  it("refuses messaging a company the seeker has never applied to", () => {
    expect(seekerCanMessageCompany([])).toBe(false);
  });

  it("allows messaging about a specific job the seeker applied to", () => {
    expect(seekerCanMessageCompany(["job-1", "job-2"], "job-2")).toBe(true);
  });

  it("refuses a jobId that belongs to a different company", () => {
    // appliedJobIds is pre-scoped to the target company by the caller, so a
    // job the seeker applied to at another company never appears here.
    expect(seekerCanMessageCompany(["job-1"], "job-99")).toBe(false);
  });

  it("refuses a jobId when the seeker has no applications to the company at all", () => {
    expect(seekerCanMessageCompany([], "job-1")).toBe(false);
  });
});
