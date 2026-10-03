import { describe, expect, it } from "vitest";
import { hiredTransitionData } from "@/lib/hiring/mark-hired";

const NOW = new Date("2026-10-03T12:00:00Z");
const EARLIER = new Date("2026-09-01T00:00:00Z");

const fresh = {
  status: "INTERVIEW" as const,
  hiredAt: null,
  hireSource: null,
  hireConfirmedBySeekerAt: null,
};

describe("hiredTransitionData", () => {
  it("returns nothing for a non-HIRED target", () => {
    expect(hiredTransitionData(fresh, "REJECTED", { hireSource: "EMPLOYER_MARKED" }, NOW)).toEqual({
      data: {},
      firstHire: false,
    });
  });

  it("returns nothing when no status is being set", () => {
    expect(hiredTransitionData(fresh, undefined, { hireSource: "EMPLOYER_MARKED" }, NOW)).toEqual({
      data: {},
      firstHire: false,
    });
  });

  it("stamps hiredAt and hireSource on the first hire", () => {
    expect(hiredTransitionData(fresh, "HIRED", { hireSource: "EMPLOYER_MARKED" }, NOW)).toEqual({
      data: { hiredAt: NOW, hireSource: "EMPLOYER_MARKED" },
      firstHire: true,
    });
  });

  it("never moves hiredAt on a re-hire", () => {
    const result = hiredTransitionData(
      { ...fresh, hiredAt: EARLIER, hireSource: "EMPLOYER_MARKED" },
      "HIRED",
      { hireSource: "EMPLOYER_MARKED" },
      NOW
    );
    expect(result.firstHire).toBe(false);
    expect(result.data).not.toHaveProperty("hiredAt");
  });

  it("stamps nothing when an already-HIRED application is re-saved", () => {
    // Team-workspace hires from before lib/hiring existed: HIRED, hiredAt null.
    // Re-saving one (a note, a rating) must not invent today as the hire date.
    const legacy = { ...fresh, status: "HIRED" as const };
    expect(hiredTransitionData(legacy, "HIRED", { hireSource: "EMPLOYER_MARKED" }, NOW)).toEqual({
      data: {},
      firstHire: false,
    });
  });

  it("keeps an existing hireSource", () => {
    const result = hiredTransitionData(
      { ...fresh, hiredAt: EARLIER, hireSource: "OFFER_ACCEPTED" },
      "HIRED",
      { hireSource: "EMPLOYER_MARKED" },
      NOW
    );
    expect(result.data).not.toHaveProperty("hireSource");
  });

  it("stamps hireConfirmedBySeekerAt once when the seeker confirmed", () => {
    const first = hiredTransitionData(
      fresh,
      "HIRED",
      { hireSource: "OFFER_ACCEPTED", seekerConfirmed: true },
      NOW
    );
    expect(first.data.hireConfirmedBySeekerAt).toEqual(NOW);

    const again = hiredTransitionData(
      { ...fresh, hiredAt: EARLIER, hireConfirmedBySeekerAt: EARLIER },
      "HIRED",
      { hireSource: "OFFER_ACCEPTED", seekerConfirmed: true },
      NOW
    );
    expect(again.data).not.toHaveProperty("hireConfirmedBySeekerAt");
  });

  it("does not stamp hireConfirmedBySeekerAt when the seeker did not confirm", () => {
    const result = hiredTransitionData(
      fresh,
      "HIRED",
      { hireSource: "EMPLOYER_MARKED", seekerConfirmed: false },
      NOW
    );
    expect(result.data).not.toHaveProperty("hireConfirmedBySeekerAt");
  });
});
