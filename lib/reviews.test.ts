import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  PUBLIC_REVIEW_STATUSES,
  REVIEW_WINDOW_DAYS,
  assertApplicationReviewable,
  directionForAuthorRole,
  isPubliclyVisibleReviewStatus,
  isReviewWindowExpired,
  isWithinReviewWindow,
  oppositeDirection,
  resolveReviewAuthorRole,
  shouldRevealOnSubmit,
} from "@/lib/reviews";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("resolveReviewAuthorRole — direction derivation", () => {
  it("identifies the seeker on the application as the SEEKER author", () => {
    const role = resolveReviewAuthorRole({
      userId: "user-seeker-1",
      seekerUserId: "user-seeker-1",
      isActiveCompanyMember: false,
    });
    expect(role).toBe("SEEKER");
  });

  it("identifies an active company member (who is not the seeker) as COMPANY_MEMBER", () => {
    const role = resolveReviewAuthorRole({
      userId: "user-employer-1",
      seekerUserId: "user-seeker-1",
      isActiveCompanyMember: true,
    });
    expect(role).toBe("COMPANY_MEMBER");
  });

  it("rejects a caller who is neither the seeker nor an active member of the company — never falls back to a guess", () => {
    expect(() =>
      resolveReviewAuthorRole({
        userId: "user-stranger",
        seekerUserId: "user-seeker-1",
        isActiveCompanyMember: false,
      })
    ).toThrow(ApiError);
  });

  it("throws a 403 for an unauthorized caller", () => {
    try {
      resolveReviewAuthorRole({
        userId: "user-stranger",
        seekerUserId: "user-seeker-1",
        isActiveCompanyMember: false,
      });
      expect.fail("expected resolveReviewAuthorRole to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(403);
    }
  });

  it("prefers SEEKER even if isActiveCompanyMember were somehow also true for the same user — a seeker can never be attributed to the employer side", () => {
    const role = resolveReviewAuthorRole({
      userId: "user-seeker-1",
      seekerUserId: "user-seeker-1",
      isActiveCompanyMember: true,
    });
    expect(role).toBe("SEEKER");
  });
});

describe("directionForAuthorRole / oppositeDirection", () => {
  it("maps SEEKER to SEEKER_TO_COMPANY and COMPANY_MEMBER to COMPANY_TO_SEEKER", () => {
    expect(directionForAuthorRole("SEEKER")).toBe("SEEKER_TO_COMPANY");
    expect(directionForAuthorRole("COMPANY_MEMBER")).toBe("COMPANY_TO_SEEKER");
  });

  it("oppositeDirection is its own inverse", () => {
    expect(oppositeDirection("SEEKER_TO_COMPANY")).toBe("COMPANY_TO_SEEKER");
    expect(oppositeDirection("COMPANY_TO_SEEKER")).toBe("SEEKER_TO_COMPANY");
    expect(oppositeDirection(oppositeDirection("SEEKER_TO_COMPANY"))).toBe("SEEKER_TO_COMPANY");
  });
});

describe("isWithinReviewWindow / isReviewWindowExpired — the 14-day boundary", () => {
  const hiredAt = new Date("2026-01-01T00:00:00.000Z");

  it("is a 14-day window", () => {
    expect(REVIEW_WINDOW_DAYS).toBe(14);
  });

  it("is within the window immediately after hiring", () => {
    const now = new Date(hiredAt.getTime() + 1);
    expect(isWithinReviewWindow(hiredAt, now)).toBe(true);
    expect(isReviewWindowExpired(hiredAt, now)).toBe(false);
  });

  it("is within the window at exactly 14 days — inclusive boundary", () => {
    const now = new Date(hiredAt.getTime() + 14 * DAY_MS);
    expect(isWithinReviewWindow(hiredAt, now)).toBe(true);
    expect(isReviewWindowExpired(hiredAt, now)).toBe(false);
  });

  it("is expired one millisecond past the 14-day mark", () => {
    const now = new Date(hiredAt.getTime() + 14 * DAY_MS + 1);
    expect(isWithinReviewWindow(hiredAt, now)).toBe(false);
    expect(isReviewWindowExpired(hiredAt, now)).toBe(true);
  });

  it("is expired well past the window (e.g. 30 days)", () => {
    const now = new Date(hiredAt.getTime() + 30 * DAY_MS);
    expect(isWithinReviewWindow(hiredAt, now)).toBe(false);
    expect(isReviewWindowExpired(hiredAt, now)).toBe(true);
  });

  it("the two predicates are exact complements at every point around the boundary — no gap, no overlap", () => {
    for (let offsetMs = -5; offsetMs <= 5; offsetMs++) {
      const now = new Date(hiredAt.getTime() + 14 * DAY_MS + offsetMs);
      expect(isWithinReviewWindow(hiredAt, now)).toBe(!isReviewWindowExpired(hiredAt, now));
    }
  });
});

describe("assertApplicationReviewable — eligibility", () => {
  const hiredAt = new Date("2026-01-01T00:00:00.000Z");

  it("allows a HIRED application with hiredAt set, inside the window", () => {
    const now = new Date(hiredAt.getTime() + 5 * DAY_MS);
    expect(() => assertApplicationReviewable({ status: "HIRED", hiredAt }, now)).not.toThrow();
  });

  it("rejects an application that never reached HIRED", () => {
    expect(() => assertApplicationReviewable({ status: "INTERVIEW", hiredAt: null }, new Date())).toThrow(
      ApiError
    );
  });

  it("rejects a HIRED application missing hiredAt (should never happen post-migration, but must fail closed)", () => {
    expect(() => assertApplicationReviewable({ status: "HIRED", hiredAt: null }, new Date())).toThrow(ApiError);
  });

  it("rejects once the 14-day window has expired", () => {
    const now = new Date(hiredAt.getTime() + 15 * DAY_MS);
    expect(() => assertApplicationReviewable({ status: "HIRED", hiredAt }, now)).toThrow(ApiError);
  });

  it("rejects with a 400 status", () => {
    try {
      assertApplicationReviewable({ status: "REJECTED", hiredAt: null }, new Date());
      expect.fail("expected assertApplicationReviewable to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });
});

describe("shouldRevealOnSubmit — the reveal decision", () => {
  it("reveals when the opposite side's row is PENDING_REVEAL (both sides have now submitted)", () => {
    expect(shouldRevealOnSubmit("PENDING_REVEAL")).toBe(true);
  });

  it("does not reveal when there is no opposite row yet — this submission stays PENDING_REVEAL", () => {
    expect(shouldRevealOnSubmit(null)).toBe(false);
  });

  it("does not re-reveal an opposite row that is already PUBLISHED, DISPUTED, or HIDDEN", () => {
    expect(shouldRevealOnSubmit("PUBLISHED")).toBe(false);
    expect(shouldRevealOnSubmit("DISPUTED")).toBe(false);
    expect(shouldRevealOnSubmit("HIDDEN")).toBe(false);
  });
});

describe("PENDING_REVEAL never appears in a public read", () => {
  it("PUBLIC_REVIEW_STATUSES excludes PENDING_REVEAL and HIDDEN", () => {
    expect(PUBLIC_REVIEW_STATUSES).toEqual(["PUBLISHED", "DISPUTED"]);
    expect(PUBLIC_REVIEW_STATUSES).not.toContain("PENDING_REVEAL");
    expect(PUBLIC_REVIEW_STATUSES).not.toContain("HIDDEN");
  });

  it("isPubliclyVisibleReviewStatus is true only for PUBLISHED and DISPUTED", () => {
    expect(isPubliclyVisibleReviewStatus("PUBLISHED")).toBe(true);
    expect(isPubliclyVisibleReviewStatus("DISPUTED")).toBe(true);
    expect(isPubliclyVisibleReviewStatus("PENDING_REVEAL")).toBe(false);
    expect(isPubliclyVisibleReviewStatus("HIDDEN")).toBe(false);
  });
});
