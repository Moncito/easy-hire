import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api-error";
import { assertChangePasswordInput } from "@/lib/account/change-password";

describe("assertChangePasswordInput", () => {
  it("requires currentPassword", () => {
    try {
      assertChangePasswordInput({ newPassword: "Sup3rSecret1" });
      expect.fail("expected assertChangePasswordInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toMatch(/current password/i);
    }
  });

  it("requires newPassword", () => {
    try {
      assertChangePasswordInput({ currentPassword: "OldPassw0rd" });
      expect.fail("expected assertChangePasswordInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toMatch(/new password/i);
    }
  });

  it("rejects a new password identical to the current one", () => {
    try {
      assertChangePasswordInput({ currentPassword: "SamePassw0rd", newPassword: "SamePassw0rd" });
      expect.fail("expected assertChangePasswordInput to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(400);
      expect((error as ApiError).message).toMatch(/different from your current password/i);
    }
  });

  it("allows a distinct current/new password pair", () => {
    expect(() =>
      assertChangePasswordInput({ currentPassword: "OldPassw0rd", newPassword: "NewPassw0rd" })
    ).not.toThrow();
  });
});
