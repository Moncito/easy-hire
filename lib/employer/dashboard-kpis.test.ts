import { describe, expect, it } from "vitest";
import { buildDailySeries, countFilled, waitBarGeometry } from "@/lib/employer/dashboard-kpis";

const now = new Date(2026, 8, 30, 15, 0, 0); // Sep 30, 3pm local
const day = (daysAgo: number, hour = 10) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d;
};

describe("buildDailySeries", () => {
  it("buckets by local day, oldest first, ending today", () => {
    const { series, current } = buildDailySeries([day(0), day(0, 23), day(6)], 7, now);
    expect(series).toEqual([1, 0, 0, 0, 0, 0, 2]);
    expect(current).toBe(3);
  });

  it("counts the equally long window before the range as the previous period", () => {
    const { previous, current } = buildDailySeries([day(7), day(13), day(14), day(2)], 7, now);
    expect(current).toBe(1);
    // day 7 and day 13 fall in the previous 7 days; day 14 is outside both.
    expect(previous).toBe(2);
  });

  it("returns an all-zero series for no applications", () => {
    expect(buildDailySeries([], 30, now)).toEqual({ series: new Array(30).fill(0), current: 0, previous: 0 });
  });
});

describe("waitBarGeometry", () => {
  it("fills past the target marker when overdue", () => {
    const g = waitBarGeometry(37, 14);
    expect(g.overdue).toBe(true);
    expect(g.fill).toBe(1);
    expect(g.target).toBeCloseTo(14 / 37);
  });

  it("places the marker at the end while still inside the target", () => {
    const g = waitBarGeometry(7, 14);
    expect(g.overdue).toBe(false);
    expect(g.fill).toBe(0.5);
    expect(g.target).toBe(1);
  });

  it("is not overdue exactly at the target", () => {
    expect(waitBarGeometry(14, 14).overdue).toBe(false);
  });
});

describe("countFilled", () => {
  it("caps each role at its target", () => {
    expect(
      countFilled([
        { targetHireCount: 1, hired: 3 },
        { targetHireCount: 2, hired: 1 },
        { targetHireCount: 1, hired: 0 },
      ])
    ).toBe(2);
  });
});
