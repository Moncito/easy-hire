import { describe, expect, it } from "vitest";
import { furthestStageReached, stageChangeActivityData } from "@/lib/jobs/stage-history";

describe("stageChangeActivityData", () => {
  it("writes structured columns and keeps the display body the timeline renders", () => {
    expect(
      stageChangeActivityData({
        applicationId: "app_1",
        fromStatus: "APPLIED",
        toStatus: "INTERVIEW",
        actorMemberId: null,
      })
    ).toEqual({
      applicationId: "app_1",
      type: "STAGE_CHANGE",
      body: "APPLIED → INTERVIEW",
      fromStatus: "APPLIED",
      toStatus: "INTERVIEW",
      actorMemberId: null,
    });
  });
});

describe("furthestStageReached", () => {
  it("uses the current status when there is no history", () => {
    expect(furthestStageReached("INTERVIEW", [])).toBe("INTERVIEW");
    expect(furthestStageReached("HIRED", [])).toBe("HIRED");
  });

  it("floors a rejection with no history at APPLIED rather than guessing", () => {
    expect(furthestStageReached("REJECTED", [])).toBe("APPLIED");
  });

  it("credits a rejected application with the furthest stage it passed through", () => {
    expect(furthestStageReached("REJECTED", ["APPLIED", "SHORTLISTED", "INTERVIEW"])).toBe("INTERVIEW");
  });

  it("never moves backwards when an application was moved back a stage", () => {
    expect(furthestStageReached("SHORTLISTED", ["INTERVIEW"])).toBe("INTERVIEW");
  });
});
