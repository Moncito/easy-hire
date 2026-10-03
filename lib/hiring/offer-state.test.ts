import { describe, expect, it } from "vitest";
import {
  createOfferBlocker,
  effectiveOfferStatus,
  formatOfferRate,
  offerActionBlocker,
  offerExpiry,
} from "@/lib/hiring/offer-state";

const now = new Date("2026-10-01T12:00:00Z");
const future = new Date("2026-10-05T00:00:00Z");
const past = new Date("2026-09-30T00:00:00Z");

describe("effectiveOfferStatus", () => {
  it("keeps a PENDING offer PENDING before expiry", () => {
    expect(effectiveOfferStatus({ status: "PENDING", expiresAt: future }, now)).toBe("PENDING");
  });
  it("treats a PENDING offer past expiry as EXPIRED", () => {
    expect(effectiveOfferStatus({ status: "PENDING", expiresAt: past }, now)).toBe("EXPIRED");
  });
  it("treats exactly expiresAt as expired", () => {
    expect(effectiveOfferStatus({ status: "PENDING", expiresAt: now }, now)).toBe("EXPIRED");
  });
  it("never rewrites a terminal status", () => {
    for (const status of ["ACCEPTED", "DECLINED", "WITHDRAWN", "EXPIRED"] as const) {
      expect(effectiveOfferStatus({ status, expiresAt: past }, now)).toBe(status);
    }
  });
});

describe("offerActionBlocker", () => {
  it("allows an open offer", () => {
    expect(offerActionBlocker({ status: "PENDING", expiresAt: future }, now)).toBeNull();
  });
  it("blocks an expired offer, including exactly at the boundary", () => {
    expect(offerActionBlocker({ status: "PENDING", expiresAt: past }, now)).toBe("This offer has expired.");
    expect(offerActionBlocker({ status: "PENDING", expiresAt: now }, now)).toBe("This offer has expired.");
  });
  it("blocks each terminal status with its own message", () => {
    expect(offerActionBlocker({ status: "ACCEPTED", expiresAt: future }, now)).toBe("This offer was already accepted.");
    expect(offerActionBlocker({ status: "DECLINED", expiresAt: future }, now)).toBe("This offer was already declined.");
    expect(offerActionBlocker({ status: "WITHDRAWN", expiresAt: future }, now)).toBe("This offer was withdrawn.");
    expect(offerActionBlocker({ status: "EXPIRED", expiresAt: future }, now)).toBe("This offer has expired.");
  });
});

describe("createOfferBlocker", () => {
  it("blocks HIRED and REJECTED applications", () => {
    expect(createOfferBlocker("HIRED")).toBe("This candidate is already hired.");
    expect(createOfferBlocker("REJECTED")).toBe("This application was rejected.");
  });
  it("allows the in-progress stages", () => {
    for (const status of ["APPLIED", "SHORTLISTED", "INTERVIEW"] as const) {
      expect(createOfferBlocker(status)).toBeNull();
    }
  });
});

describe("offerExpiry", () => {
  it("is seven days after now", () => {
    expect(offerExpiry(now).toISOString()).toBe("2026-10-08T12:00:00.000Z");
  });
});

describe("formatOfferRate", () => {
  it("formats a monthly USD rate", () => {
    expect(formatOfferRate({ monthlyRateCents: 300000, hourlyRateCents: null, currency: "USD" })).toBe("$3,000.00/mo");
  });
  it("formats an hourly PHP rate", () => {
    expect(formatOfferRate({ monthlyRateCents: null, hourlyRateCents: 50000, currency: "PHP" })).toBe("₱500.00/hr");
  });
});
