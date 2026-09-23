import { describe, expect, it } from "vitest";
import { sendCategorizedEmail, shouldSendCategoryEmail } from "@/lib/shared/email-preferences";

describe("shouldSendCategoryEmail — which flag gates which category", () => {
  it("SECURITY always sends, even when the flag is off", () => {
    expect(shouldSendCategoryEmail("SECURITY", false)).toBe(true);
  });

  it("INTERVIEW always sends, even when the flag is off", () => {
    expect(shouldSendCategoryEmail("INTERVIEW", false)).toBe(true);
  });

  it("MESSAGES follows notifyMessages", () => {
    expect(shouldSendCategoryEmail("MESSAGES", true)).toBe(true);
    expect(shouldSendCategoryEmail("MESSAGES", false)).toBe(false);
  });

  it("APPLICATION_UPDATES follows notifyApplicationUpdates", () => {
    expect(shouldSendCategoryEmail("APPLICATION_UPDATES", true)).toBe(true);
    expect(shouldSendCategoryEmail("APPLICATION_UPDATES", false)).toBe(false);
  });

  it("PRODUCT_DIGEST follows notifyProductDigest", () => {
    expect(shouldSendCategoryEmail("PRODUCT_DIGEST", true)).toBe(true);
    expect(shouldSendCategoryEmail("PRODUCT_DIGEST", false)).toBe(false);
  });
});

describe("sendCategorizedEmail — security/interview mail bypasses the flags entirely", () => {
  it("skips the send callback when a gated category is disabled", async () => {
    let called = false;
    const result = await sendCategorizedEmail("MESSAGES", false, async () => {
      called = true;
      return true;
    });
    expect(called).toBe(false);
    expect(result).toBe(false);
  });

  it("calls through and returns the send result when a gated category is enabled", async () => {
    const result = await sendCategorizedEmail("PRODUCT_DIGEST", true, async () => true);
    expect(result).toBe(true);
  });

  it("always calls through for SECURITY, regardless of the flag", async () => {
    let called = false;
    await sendCategorizedEmail("SECURITY", false, async () => {
      called = true;
      return true;
    });
    expect(called).toBe(true);
  });

  it("always calls through for INTERVIEW, regardless of the flag", async () => {
    let called = false;
    await sendCategorizedEmail("INTERVIEW", false, async () => {
      called = true;
      return true;
    });
    expect(called).toBe(true);
  });
});
