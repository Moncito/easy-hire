import { describe, expect, it } from "vitest";
import { canEmployerStartConversation, seekerCanMessageCompany } from "@/lib/messages";

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

describe("canEmployerStartConversation — charge for sourcing, never for replying", () => {
  it("allows a Pro employer to message an applicant", () => {
    expect(
      canEmployerStartConversation({ isPro: true, hasApplied: true, conversationExists: false })
    ).toBe(true);
  });

  it("allows a Pro employer to source a seeker who never applied", () => {
    expect(
      canEmployerStartConversation({ isPro: true, hasApplied: false, conversationExists: false })
    ).toBe(true);
  });

  it("allows a Free employer to message an applicant for free", () => {
    expect(
      canEmployerStartConversation({ isPro: false, hasApplied: true, conversationExists: false })
    ).toBe(true);
  });

  it("refuses a Free employer sourcing a seeker who never applied — no conversation yet", () => {
    expect(
      canEmployerStartConversation({ isPro: false, hasApplied: false, conversationExists: false })
    ).toBe(false);
  });

  it("lets a Free employer keep an already-existing conversation even with no application on file", () => {
    // Guards against locking a Free employer out of their own inbox for a
    // thread started while Pro (or before this gate shipped).
    expect(
      canEmployerStartConversation({ isPro: false, hasApplied: false, conversationExists: true })
    ).toBe(true);
  });
});
