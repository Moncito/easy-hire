import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { assertOwnedObjectPath } from "@/lib/shared/storage";

const BUCKET = "resumes";
const ME = "user-me";
const OTHER = "user-other";

describe("assertOwnedObjectPath — owned-prefix enforcement for client-supplied storage paths", () => {
  it("accepts a bare path that already lives under one of the caller's own prefixes", () => {
    const path = assertOwnedObjectPath(BUCKET, `${ME}/1700000000-resume.pdf`, [`${ME}/`]);
    expect(path).toBe(`${ME}/1700000000-resume.pdf`);
  });

  it("normalizes a signed URL for an owned path and accepts it", () => {
    const signedUrl = `https://example.supabase.co/storage/v1/object/sign/${BUCKET}/${ME}/1700000000-resume.pdf?token=abc.def.ghi`;
    const path = assertOwnedObjectPath(BUCKET, signedUrl, [`${ME}/`]);
    expect(path).toBe(`${ME}/1700000000-resume.pdf`);
  });

  it("rejects a foreign path with a 400 ApiError", () => {
    expect(() =>
      assertOwnedObjectPath(BUCKET, `${OTHER}/1700000000-resume.pdf`, [`${ME}/`])
    ).toThrow(ApiError);

    try {
      assertOwnedObjectPath(BUCKET, `${OTHER}/1700000000-resume.pdf`, [`${ME}/`]);
      expect.fail("expected assertOwnedObjectPath to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
    }
  });

  it("rejects the prefix-confusion case — user 12's prefix must not match a path belonging to user 123", () => {
    expect(() => assertOwnedObjectPath(BUCKET, "123/secret-resume.pdf", ["12/"])).toThrow(ApiError);
  });

  it("does not falsely accept a path that merely starts with the same characters as an owned id without the separator", () => {
    expect(() => assertOwnedObjectPath(BUCKET, "user-me-2/resume.pdf", [`${ME}/`])).toThrow(ApiError);
  });

  it("allows a legacy stored value via allowUnchanged even though it doesn't match today's prefix convention", () => {
    const legacyValue = "legacy/old-style-path-resume.pdf";
    const path = assertOwnedObjectPath(BUCKET, legacyValue, [`${ME}/`], { allowUnchanged: legacyValue });
    expect(path).toBe(legacyValue);
  });

  it("allowUnchanged does not widen acceptance to other, different foreign paths", () => {
    const legacyValue = "legacy/old-style-path-resume.pdf";
    expect(() =>
      assertOwnedObjectPath(BUCKET, `${OTHER}/other-resume.pdf`, [`${ME}/`], { allowUnchanged: legacyValue })
    ).toThrow(ApiError);
  });

  it("accepts the caller's own identity document prefix", () => {
    const path = assertOwnedObjectPath("verification-docs", `identity/${ME}/1700000000-id.pdf`, [
      `identity/${ME}/`,
    ]);
    expect(path).toBe(`identity/${ME}/1700000000-id.pdf`);
  });

  it("rejects another user's identity document prefix", () => {
    expect(() =>
      assertOwnedObjectPath("verification-docs", `identity/${OTHER}/1700000000-id.pdf`, [`identity/${ME}/`])
    ).toThrow(ApiError);
  });

  it("rejects a bare foreign path (no identity/ prefix) against the identity prefix allowlist", () => {
    expect(() =>
      assertOwnedObjectPath("verification-docs", `${OTHER}/1700000000-permit.pdf`, [`identity/${ME}/`])
    ).toThrow(ApiError);
  });

  it("the error message never echoes back the attacker-supplied path", () => {
    const attackerPath = `${OTHER}/very-secret-government-id.pdf`;
    try {
      assertOwnedObjectPath(BUCKET, attackerPath, [`${ME}/`]);
      expect.fail("expected assertOwnedObjectPath to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).not.toContain(attackerPath);
      expect((error as ApiError).message).not.toContain(OTHER);
    }
  });
});
