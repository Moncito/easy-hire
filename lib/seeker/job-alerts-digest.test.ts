import { describe, expect, it } from "vitest";
import { digestWindowStart, shouldSendJobAlertDigest } from "@/lib/seeker/job-alerts-digest";

describe("digestWindowStart", () => {
  it("goes back 1 day for DAILY", () => {
    const now = new Date("2026-08-30T13:00:00.000Z");
    const start = digestWindowStart("DAILY", now);
    expect(start.toISOString()).toBe("2026-08-29T13:00:00.000Z");
  });

  it("goes back 7 days for WEEKLY", () => {
    const now = new Date("2026-08-30T13:00:00.000Z");
    const start = digestWindowStart("WEEKLY", now);
    expect(start.toISOString()).toBe("2026-08-23T13:00:00.000Z");
  });
});

describe("shouldSendJobAlertDigest (duplicate-send guard)", () => {
  const windowStart = new Date("2026-08-29T13:00:00.000Z");

  it("sends when the alert has never been sent", () => {
    expect(shouldSendJobAlertDigest(null, windowStart)).toBe(true);
  });

  it("skips a retry that already sent inside the current window", () => {
    const lastSentAt = new Date("2026-08-30T00:00:00.000Z"); // after windowStart
    expect(shouldSendJobAlertDigest(lastSentAt, windowStart)).toBe(false);
  });

  it("skips when lastSentAt exactly equals the window start", () => {
    expect(shouldSendJobAlertDigest(new Date(windowStart), windowStart)).toBe(false);
  });

  it("sends again once lastSentAt falls outside (before) the new window", () => {
    const lastSentAt = new Date("2026-08-20T00:00:00.000Z"); // a prior window
    expect(shouldSendJobAlertDigest(lastSentAt, windowStart)).toBe(true);
  });
});
