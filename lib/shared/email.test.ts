import { describe, expect, it, vi } from "vitest";
import { resolveRecipient } from "@/lib/shared/email";

describe("resolveRecipient", () => {
  it("applies the override in development", () => {
    const result = resolveRecipient("seeker@example.com", "test@resend.dev", "development");
    expect(result).toEqual({ recipient: "test@resend.dev", overridden: true });
  });

  it("ignores the override in production and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = resolveRecipient("seeker@example.com", "test@resend.dev", "production");
    expect(result).toEqual({ recipient: "seeker@example.com", overridden: false });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/EMAIL_TEST_RECIPIENT/);
    warnSpy.mockRestore();
  });

  it("does not warn when no override is set, in either environment", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveRecipient("seeker@example.com", undefined, "development")).toEqual({
      recipient: "seeker@example.com",
      overridden: false,
    });
    expect(resolveRecipient("seeker@example.com", undefined, "production")).toEqual({
      recipient: "seeker@example.com",
      overridden: false,
    });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not mark overridden when the test recipient is the same address (case-insensitive)", () => {
    const result = resolveRecipient("Seeker@Example.com", "seeker@example.com", "development");
    expect(result).toEqual({ recipient: "seeker@example.com", overridden: false });
  });

  it("treats a blank/whitespace-only EMAIL_TEST_RECIPIENT as unset", () => {
    const result = resolveRecipient("seeker@example.com", "   ", "development");
    expect(result).toEqual({ recipient: "seeker@example.com", overridden: false });
  });
});
