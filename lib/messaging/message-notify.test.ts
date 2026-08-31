import { describe, expect, it } from "vitest";
import { shouldSendNewMessageEmail } from "@/lib/messaging/message-notify";

describe("shouldSendNewMessageEmail", () => {
  it("sends when there is no earlier unread message in the thread (first unread)", () => {
    expect(shouldSendNewMessageEmail(0)).toBe(true);
  });

  it("stays silent when the recipient already has one earlier unread message", () => {
    expect(shouldSendNewMessageEmail(1)).toBe(false);
  });

  it("stays silent for a long unread backlog", () => {
    expect(shouldSendNewMessageEmail(12)).toBe(false);
  });

  it("treats a defensive negative count the same as zero (sends)", () => {
    expect(shouldSendNewMessageEmail(-1)).toBe(true);
  });
});
