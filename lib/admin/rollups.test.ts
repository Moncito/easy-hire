import { afterEach, describe, expect, it, vi } from "vitest";
import { isTodayOrYesterdayUtc } from "@/lib/admin/rollups";

/**
 * Guards the one predicate that decides whether a rollup row reports a real
 * moderation backlog or `null`.
 *
 * It matters more than its size suggests: `queueDepths` is a point-in-time
 * count with no historical equivalent, so if this ever returns true for an
 * old date, a backfill silently stamps today's backlog across months of
 * history and draws a flat line that looks like real data. Getting it wrong
 * fails quietly and convincingly, which is exactly the kind of bug worth
 * pinning down with tests.
 */

const FIXED_NOW = new Date("2026-09-12T04:30:00.000Z");

function useFixedClock() {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("isTodayOrYesterdayUtc", () => {
  it("accepts the current UTC day", () => {
    useFixedClock();
    expect(isTodayOrYesterdayUtc(new Date("2026-09-12T00:00:00.000Z"))).toBe(true);
    expect(isTodayOrYesterdayUtc(new Date("2026-09-12T23:59:59.999Z"))).toBe(true);
  });

  it("accepts the previous UTC day — the day the nightly cron actually rolls up", () => {
    useFixedClock();
    expect(isTodayOrYesterdayUtc(new Date("2026-09-11T00:00:00.000Z"))).toBe(true);
    expect(isTodayOrYesterdayUtc(new Date("2026-09-11T12:00:00.000Z"))).toBe(true);
  });

  it("rejects two days ago, the first date a backfill would touch", () => {
    useFixedClock();
    expect(isTodayOrYesterdayUtc(new Date("2026-09-10T23:59:59.999Z"))).toBe(false);
  });

  it("rejects distant history", () => {
    useFixedClock();
    expect(isTodayOrYesterdayUtc(new Date("2026-06-01T00:00:00.000Z"))).toBe(false);
    expect(isTodayOrYesterdayUtc(new Date("2025-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("rejects the future", () => {
    useFixedClock();
    expect(isTodayOrYesterdayUtc(new Date("2026-09-13T00:00:00.000Z"))).toBe(false);
  });

  it("compares whole UTC days, not elapsed hours", () => {
    // 21:00 the previous day is only ~7.5h before FIXED_NOW, well inside 24h,
    // but it is still "yesterday" and must be accepted on day identity rather
    // than on a rolling 24-hour difference.
    useFixedClock();
    expect(isTodayOrYesterdayUtc(new Date("2026-09-11T21:00:00.000Z"))).toBe(true);

    // And 00:30 two days ago is ~52h back — rejected, even though a naive
    // "within 48 hours" check would let it through.
    expect(isTodayOrYesterdayUtc(new Date("2026-09-10T00:30:00.000Z"))).toBe(false);
  });

  it("rolls over correctly across a month boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T00:10:00.000Z"));
    expect(isTodayOrYesterdayUtc(new Date("2026-10-01T00:00:00.000Z"))).toBe(true);
    expect(isTodayOrYesterdayUtc(new Date("2026-09-30T23:00:00.000Z"))).toBe(true);
    expect(isTodayOrYesterdayUtc(new Date("2026-09-29T23:00:00.000Z"))).toBe(false);
  });
});
