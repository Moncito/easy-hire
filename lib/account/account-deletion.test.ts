import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { assertCanDeleteOwnedCompany, collectProfileImageStorageTargets } from "@/lib/account/account-deletion";

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

describe("collectProfileImageStorageTargets", () => {
  it("returns no targets when nothing is set", () => {
    expect(
      collectProfileImageStorageTargets({
        companyLogoUrl: null,
        companyBannerUrl: null,
        seekerPhotoUrl: null,
        avatarUrl: null,
      })
    ).toEqual([]);
  });

  it("collects a company's logo and banner into their respective buckets", () => {
    const targets = collectProfileImageStorageTargets({
      companyLogoUrl: "user-1/123-logo.png",
      companyBannerUrl: "user-1/banner.png?v=456",
      seekerPhotoUrl: null,
      avatarUrl: null,
    });

    expect(targets).toEqual([
      { bucket: "logos", path: "user-1/123-logo.png" },
      { bucket: "banners", path: "user-1/banner.png?v=456" },
    ]);
  });

  it("collects a seeker's photo and a user's avatar into the photos bucket", () => {
    const targets = collectProfileImageStorageTargets({
      companyLogoUrl: null,
      companyBannerUrl: null,
      seekerPhotoUrl: "user-2/photo.jpg?v=1",
      avatarUrl: "user-2/avatar.png?v=2",
    });

    expect(targets).toEqual([
      { bucket: "photos", path: "user-2/photo.jpg?v=1" },
      { bucket: "photos", path: "user-2/avatar.png?v=2" },
    ]);
  });

  it("collects all four when everything is set, undefined behaves like null", () => {
    const targets = collectProfileImageStorageTargets({
      companyLogoUrl: "logo-path",
      companyBannerUrl: undefined,
      seekerPhotoUrl: "photo-path",
      avatarUrl: "avatar-path",
    });

    expect(targets).toEqual([
      { bucket: "logos", path: "logo-path" },
      { bucket: "photos", path: "photo-path" },
      { bucket: "photos", path: "avatar-path" },
    ]);
  });
});
