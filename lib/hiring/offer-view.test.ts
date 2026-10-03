import { describe, expect, it } from "vitest";
import { daysLeft, daysLeftLabel } from "@/components/employer/candidate-detail/offer-view";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-03T12:00:00Z");

describe("daysLeft", () => {
  it("shows a fresh 7-day offer as 7 even when nowMs is a little stale", () => {
    expect(daysLeft(new Date(NOW + 7 * DAY + 5 * 60 * 1000).toISOString(), NOW)).toBe(7);
  });

  it("never goes negative", () => {
    expect(daysLeft(new Date(NOW - DAY).toISOString(), NOW)).toBe(0);
  });

  it("labels the last half day as expiring today", () => {
    expect(daysLeftLabel(daysLeft(new Date(NOW + 6 * 60 * 60 * 1000).toISOString(), NOW))).toBe("Expires today");
    expect(daysLeftLabel(1)).toBe("1 day left");
  });
});
