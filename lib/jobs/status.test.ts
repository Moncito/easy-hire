import { describe, expect, it } from "vitest";
import {
  assertEmployerStatusTransition,
  canEmployerSetStatus,
} from "@/lib/job-status";

describe("employer job status transitions", () => {
  it("allows ACTIVE → CLOSED", () => {
    expect(canEmployerSetStatus("ACTIVE", "CLOSED")).toBe(true);
    expect(() => assertEmployerStatusTransition("ACTIVE", "CLOSED")).not.toThrow();
  });

  it("blocks employer from setting ACTIVE", () => {
    expect(canEmployerSetStatus("DRAFT", "ACTIVE")).toBe(false);
    expect(canEmployerSetStatus("PENDING_REVIEW", "ACTIVE")).toBe(false);
    expect(() => assertEmployerStatusTransition("DRAFT", "ACTIVE")).toThrow();
  });

  it("blocks invalid transitions", () => {
    expect(canEmployerSetStatus("CLOSED", "ACTIVE")).toBe(false);
    expect(() => assertEmployerStatusTransition("CLOSED", "ACTIVE")).toThrow();
  });
});
