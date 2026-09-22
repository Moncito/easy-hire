import { describe, expect, it } from "vitest";
import { PAST_DUE_GRACE_DAYS, isWithinPastDueGrace } from "@/lib/billing/subscriptions";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("isWithinPastDueGrace — 14-day PAST_DUE grace window", () => {
  it("is a 14-day grace window", () => {
    expect(PAST_DUE_GRACE_DAYS).toBe(14);
  });

  it("stays PRO while inside the grace window", () => {
    const currentPeriodEnd = new Date("2026-09-01T00:00:00.000Z");
    const now = new Date(currentPeriodEnd.getTime() + 5 * DAY_MS);
    expect(isWithinPastDueGrace(currentPeriodEnd, now)).toBe(true);
  });

  it("stays PRO exactly on the boundary (14 days after currentPeriodEnd)", () => {
    const currentPeriodEnd = new Date("2026-09-01T00:00:00.000Z");
    const now = new Date(currentPeriodEnd.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS);
    expect(isWithinPastDueGrace(currentPeriodEnd, now)).toBe(true);
  });

  it("drops to FREE just past the 14-day boundary", () => {
    const currentPeriodEnd = new Date("2026-09-01T00:00:00.000Z");
    const now = new Date(currentPeriodEnd.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS + 1);
    expect(isWithinPastDueGrace(currentPeriodEnd, now)).toBe(false);
  });

  it("has no grace when currentPeriodEnd is null — conservative, since there's no date to measure from", () => {
    expect(isWithinPastDueGrace(null, new Date("2026-09-01T00:00:00.000Z"))).toBe(false);
  });
});
