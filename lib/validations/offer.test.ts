import { describe, expect, it } from "vitest";
import { createOfferSchema, respondToOfferSchema } from "@/lib/validations/offer";

const valid = { title: "Executive Assistant", rateType: "MONTHLY", rateCents: 300000 };

describe("createOfferSchema", () => {
  it("accepts a valid offer and defaults currency to USD", () => {
    const parsed = createOfferSchema.parse({ ...valid, startDate: "2026-11-01", hoursPerWeek: 40 });
    expect(parsed.currency).toBe("USD");
  });
  it("rejects zero, negative and fractional rates", () => {
    for (const rateCents of [0, -100, 10.5]) {
      expect(createOfferSchema.safeParse({ ...valid, rateCents }).success).toBe(false);
    }
  });
  it("rejects a malformed start date", () => {
    expect(createOfferSchema.safeParse({ ...valid, startDate: "11/01/2026" }).success).toBe(false);
  });
});

describe("respondToOfferSchema", () => {
  it("accepts accept and decline shapes", () => {
    expect(respondToOfferSchema.safeParse({ accept: true }).success).toBe(true);
    expect(respondToOfferSchema.safeParse({ accept: false, declineReason: "Took another role" }).success).toBe(true);
  });
  it("rejects a non-boolean accept", () => {
    expect(respondToOfferSchema.safeParse({ accept: "yes" }).success).toBe(false);
  });
});
