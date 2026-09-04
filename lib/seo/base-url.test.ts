import { describe, expect, it } from "vitest";
import { toAbsoluteUrl } from "@/lib/seo/base-url";

describe("toAbsoluteUrl", () => {
  it("returns an already-absolute http(s) URL unchanged", () => {
    expect(toAbsoluteUrl("https://cdn.example.com/logo.png")).toBe("https://cdn.example.com/logo.png");
    expect(toAbsoluteUrl("http://cdn.example.com/logo.png")).toBe("http://cdn.example.com/logo.png");
  });

  it("joins a bare relative path onto the base without producing //", () => {
    const result = toAbsoluteUrl("logos/company_1/logo.png");
    expect(result).not.toContain("//logos");
    expect(result?.endsWith("/logos/company_1/logo.png")).toBe(true);
  });

  it("joins a leading-slash path onto the base without producing //", () => {
    const result = toAbsoluteUrl("/logos/company_1/logo.png");
    expect(result).not.toMatch(/[^:]\/\/logos/);
    expect(result?.endsWith("/logos/company_1/logo.png")).toBe(true);
  });

  it("returns null for null, undefined, and empty input", () => {
    expect(toAbsoluteUrl(null)).toBeNull();
    expect(toAbsoluteUrl(undefined)).toBeNull();
    expect(toAbsoluteUrl("")).toBeNull();
    expect(toAbsoluteUrl("   ")).toBeNull();
  });
});
