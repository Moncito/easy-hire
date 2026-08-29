import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { assertCanDeleteOwnedCompany } from "@/lib/account/account-deletion";

describe("assertCanDeleteOwnedCompany", () => {
  it("blocks a sole owner with other active teammates", () => {
    expect(() =>
      assertCanDeleteOwnedCompany({ ownsCompany: true, otherActiveMemberCount: 3 })
    ).toThrow(ApiError);
  });

  it("blocks with a 409 status so the API can surface a clear conflict", () => {
    try {
      assertCanDeleteOwnedCompany({ ownsCompany: true, otherActiveMemberCount: 1 });
      expect.fail("expected assertCanDeleteOwnedCompany to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(409);
    }
  });

  it("allows a solo owner with no other active teammates", () => {
    expect(() =>
      assertCanDeleteOwnedCompany({ ownsCompany: true, otherActiveMemberCount: 0 })
    ).not.toThrow();
  });

  it("allows deletion for a user who doesn't own a company at all", () => {
    expect(() =>
      assertCanDeleteOwnedCompany({ ownsCompany: false, otherActiveMemberCount: 5 })
    ).not.toThrow();
  });
});
