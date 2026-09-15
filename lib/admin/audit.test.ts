import { describe, expect, it } from "vitest";
import { encodeAuditCursor, decodeAuditCursor, isAdminAuditAction, type AuditCursor } from "@/lib/admin/audit";
import { adminAuditLogQuerySchema } from "@/lib/validations/admin";

describe("audit cursor — encode/decode round trip", () => {
  it("round-trips a real cursor", () => {
    const cursor: AuditCursor = { createdAt: new Date("2026-09-10T12:00:00.000Z"), id: "log_abc" };
    const decoded = decodeAuditCursor(encodeAuditCursor(cursor));
    expect(decoded).toEqual(cursor);
  });

  it("rejects garbage input rather than throwing", () => {
    expect(decodeAuditCursor("%%%not-base64%%%")).toBeNull();
  });

  it("rejects a well-formed envelope with an invalid date string", () => {
    const malformed = Buffer.from(JSON.stringify({ createdAt: "not-a-date", id: "x" }), "utf8").toString(
      "base64url"
    );
    expect(decodeAuditCursor(malformed)).toBeNull();
  });

  it("rejects an envelope missing `id`", () => {
    const malformed = Buffer.from(JSON.stringify({ createdAt: new Date().toISOString() }), "utf8").toString(
      "base64url"
    );
    expect(decodeAuditCursor(malformed)).toBeNull();
  });
});

describe("isAdminAuditAction — the runtime whitelist listAuditLogForAdmin checks an incoming `action` filter against", () => {
  it("accepts a real action", () => {
    expect(isAdminAuditAction("COMPANY_APPROVE")).toBe(true);
    expect(isAdminAuditAction("ABUSE_REPORT_DISMISSED")).toBe(true);
  });

  it("rejects an unrecognized string", () => {
    expect(isAdminAuditAction("NOT_A_REAL_ACTION")).toBe(false);
  });

  it("rejects a lowercase near-match — the whitelist is exact, not case-insensitive", () => {
    expect(isAdminAuditAction("company_approve")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isAdminAuditAction("")).toBe(false);
  });
});

describe("adminAuditLogQuerySchema — since/until ordering", () => {
  it("accepts since before until", () => {
    const result = adminAuditLogQuerySchema.safeParse({ since: "2026-09-01T00:00:00.000Z", until: "2026-09-10T00:00:00.000Z" });
    expect(result.success).toBe(true);
  });

  it("accepts since equal to until", () => {
    const result = adminAuditLogQuerySchema.safeParse({ since: "2026-09-01T00:00:00.000Z", until: "2026-09-01T00:00:00.000Z" });
    expect(result.success).toBe(true);
  });

  it("rejects since after until", () => {
    const result = adminAuditLogQuerySchema.safeParse({ since: "2026-09-10T00:00:00.000Z", until: "2026-09-01T00:00:00.000Z" });
    expect(result.success).toBe(false);
  });

  it("accepts neither since nor until present", () => {
    const result = adminAuditLogQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts only since, with no until to compare against", () => {
    const result = adminAuditLogQuerySchema.safeParse({ since: "2026-09-01T00:00:00.000Z" });
    expect(result.success).toBe(true);
  });

  it("bounds limit to the schema's own max", () => {
    const result = adminAuditLogQuerySchema.safeParse({ limit: 500 });
    expect(result.success).toBe(false);
  });
});
