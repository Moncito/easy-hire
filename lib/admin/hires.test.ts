import { describe, expect, it } from "vitest";
import { toHireListItem, type HireRow } from "@/lib/admin/hires";

function row(overrides: Partial<HireRow> = {}): HireRow {
  return {
    id: "app1",
    hiredAt: new Date("2026-09-01T10:00:00.000Z"),
    hireSource: "OFFER_ACCEPTED",
    hireConfirmedBySeekerAt: new Date("2026-09-02T10:00:00.000Z"),
    seeker: { id: "sp1", fullName: "Ana Cruz" },
    job: { id: "job1", title: "Virtual Assistant", company: { id: "co1", companyName: "Acme" } },
    offers: [
      {
        monthlyRateCents: 300000,
        hourlyRateCents: null,
        currency: "USD",
        startDate: new Date("2026-09-15T00:00:00.000Z"),
      },
    ],
    ...overrides,
  };
}

describe("toHireListItem", () => {
  it("maps fields", () => {
    const item = toHireListItem(row());
    expect(item).toMatchObject({
      applicationId: "app1",
      hiredAt: "2026-09-01T10:00:00.000Z",
      hireSource: "OFFER_ACCEPTED",
      confirmedBySeekerAt: "2026-09-02T10:00:00.000Z",
      seekerName: "Ana Cruz",
      seekerProfileId: "sp1",
      companyId: "co1",
      companyName: "Acme",
      jobId: "job1",
      jobTitle: "Virtual Assistant",
    });
  });

  it("returns null offer and null confirmation when absent", () => {
    const item = toHireListItem(
      row({ offers: [], hireSource: null, hireConfirmedBySeekerAt: null })
    );
    expect(item.offer).toBeNull();
    expect(item.hireSource).toBeNull();
    expect(item.confirmedBySeekerAt).toBeNull();
  });

  it("formats a monthly rate label", () => {
    expect(toHireListItem(row()).offer?.rateLabel).toBe("$3,000.00/mo");
  });

  it("formats startDate as YYYY-MM-DD or null", () => {
    expect(toHireListItem(row()).offer?.startDate).toBe("2026-09-15");
    const noStart = toHireListItem(
      row({
        offers: [{ monthlyRateCents: null, hourlyRateCents: 500, currency: "PHP", startDate: null }],
      })
    );
    expect(noStart.offer).toEqual({ rateLabel: "₱5.00/hr", startDate: null });
  });
});
