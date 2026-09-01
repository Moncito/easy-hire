import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import {
  PUBLIC_REVIEW_STATUSES,
  REVIEW_WINDOW_DAYS,
  assertApplicationReviewable,
  directionForAuthorRole,
  filterDisputableReviewIds,
  isPubliclyVisibleReviewStatus,
  isReviewWindowExpired,
  isWithinReviewWindow,
  oppositeDirection,
  resolveReviewAuthorRole,
  shapeReviewableApplication,
  shouldRevealOnSubmit,
  type ReviewableApplicationCandidate,
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

describe("shapeReviewableApplication — the /api/reviews/pending eligibility + shaping decision", () => {
  const hiredAt = new Date("2026-01-01T00:00:00.000Z");

  const seekerSideCandidate: ReviewableApplicationCandidate = {
    applicationId: "app-1",
    jobId: "job-1",
    jobTitle: "Executive VA",
    status: "HIRED",
    hiredAt,
    counterpart: { type: "COMPANY", id: "company-1", name: "Acme Co", logoUrl: null },
    myReview: null,
  };

  const companySideCandidate: ReviewableApplicationCandidate = {
    applicationId: "app-2",
    jobId: "job-2",
    jobTitle: "Bookkeeper",
    status: "HIRED",
    hiredAt,
    counterpart: { type: "SEEKER", id: "seeker-1", name: "Jane Doe", headline: "Bookkeeper", photoUrl: null },
    myReview: null,
  };

  it("a reviewable application appears for the SEEKER role, inside the window, with no prior review", () => {
    const now = new Date(hiredAt.getTime() + 5 * DAY_MS);
    const entry = shapeReviewableApplication(seekerSideCandidate, "SEEKER", now);
    expect(entry).not.toBeNull();
    expect(entry!.role).toBe("SEEKER");
    expect(entry!.applicationId).toBe("app-1");
    expect(entry!.counterpart).toEqual(seekerSideCandidate.counterpart);
    expect(entry!.myReview).toBeNull();
    expect(entry!.windowExpiresAt.getTime()).toBe(hiredAt.getTime() + REVIEW_WINDOW_DAYS * DAY_MS);
  });

  it("a reviewable application appears for the COMPANY_MEMBER role, inside the window, with no prior review", () => {
    const now = new Date(hiredAt.getTime() + 5 * DAY_MS);
    const entry = shapeReviewableApplication(companySideCandidate, "COMPANY_MEMBER", now);
    expect(entry).not.toBeNull();
    expect(entry!.role).toBe("COMPANY_MEMBER");
    expect(entry!.applicationId).toBe("app-2");
    expect(entry!.counterpart).toEqual(companySideCandidate.counterpart);
    expect(entry!.myReview).toBeNull();
  });

  it("an already-reviewed application comes back with myReview populated — even past the window", () => {
    const now = new Date(hiredAt.getTime() + 30 * DAY_MS); // well past the 14-day window
    const myReview = {
      id: "review-1",
      rating: 5,
      status: "PENDING_REVEAL" as const,
      submittedAt: new Date(hiredAt.getTime() + DAY_MS),
      revealedAt: null,
    };
    const entry = shapeReviewableApplication({ ...seekerSideCandidate, myReview }, "SEEKER", now);
    expect(entry).not.toBeNull();
    expect(entry!.myReview).toEqual(myReview);
  });

  it("a non-HIRED application does not appear, regardless of role or hiredAt", () => {
    const now = new Date(hiredAt.getTime() + 5 * DAY_MS);
    const applied = { ...seekerSideCandidate, status: "APPLIED" as const, hiredAt: null };
    expect(shapeReviewableApplication(applied, "SEEKER", now)).toBeNull();

    const rejected = { ...companySideCandidate, status: "REJECTED" as const };
    expect(shapeReviewableApplication(rejected, "COMPANY_MEMBER", now)).toBeNull();
  });

  it("drops a HIRED application whose window has closed and which was never reviewed", () => {
    const now = new Date(hiredAt.getTime() + 15 * DAY_MS);
    expect(shapeReviewableApplication(seekerSideCandidate, "SEEKER", now)).toBeNull();
  });
});

describe("filterDisputableReviewIds — subject identification for the public review lists", () => {
  const companyRow = { id: "review-company-1", status: "PUBLISHED" as const, subjectCompanyId: "company-1", subjectSeekerId: null };
  const seekerRow = { id: "review-seeker-1", status: "PUBLISHED" as const, subjectCompanyId: null, subjectSeekerId: "seeker-1" };
  const disputedCompanyRow = { id: "review-company-2", status: "DISPUTED" as const, subjectCompanyId: "company-1", subjectSeekerId: null };

  it("returns nothing for a viewer who is not the subject of any row", () => {
    const ids = filterDisputableReviewIds([companyRow, seekerRow], {
      seekerId: "seeker-999",
      companyIds: ["company-999"],
    });
    expect(ids).toEqual([]);
  });

  it("returns a row's id when the viewer is the subject company (active member) and it is PUBLISHED", () => {
    const ids = filterDisputableReviewIds([companyRow], { seekerId: null, companyIds: ["company-1"] });
    expect(ids).toEqual(["review-company-1"]);
  });

  it("returns a row's id when the viewer is the subject seeker and it is PUBLISHED", () => {
    const ids = filterDisputableReviewIds([seekerRow], { seekerId: "seeker-1", companyIds: [] });
    expect(ids).toEqual(["review-seeker-1"]);
  });

  it("excludes an already-DISPUTED row even when the viewer is its subject — not re-disputable", () => {
    const ids = filterDisputableReviewIds([disputedCompanyRow], { seekerId: null, companyIds: ["company-1"] });
    expect(ids).toEqual([]);
  });

  it("only returns the subject's own rows out of a mixed batch", () => {
    const ids = filterDisputableReviewIds([companyRow, seekerRow, disputedCompanyRow], {
      seekerId: "seeker-1",
      companyIds: [],
    });
    expect(ids).toEqual(["review-seeker-1"]);
  });
});
