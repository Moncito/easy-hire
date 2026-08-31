import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { memoryRateLimit, clientKeyFromRequest } from "@/lib/shared/rate-limit";

// ---------------------------------------------------------------------------
// memoryRateLimit — pure fixed-window counter logic (no Redis involved)
// ---------------------------------------------------------------------------

describe("memoryRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request in a fresh window and reports remaining", () => {
    const key = `test:${Math.random()}`;
    const result = memoryRateLimit(key, 3, 60);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(3);
  });

  it("allows up to the limit and then blocks within the same window", () => {
    const key = `test:${Math.random()}`;
    expect(memoryRateLimit(key, 2, 60).allowed).toBe(true);
    expect(memoryRateLimit(key, 2, 60).allowed).toBe(true);

    const blocked = memoryRateLimit(key, 2, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("never reports remaining below zero once well over the limit", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 5; i++) memoryRateLimit(key, 1, 60);
    const result = memoryRateLimit(key, 1, 60);
    expect(result.remaining).toBe(0);
  });

  it("resets the count once the window has elapsed", () => {
    const key = `test:${Math.random()}`;
    expect(memoryRateLimit(key, 1, 60).allowed).toBe(true);
    expect(memoryRateLimit(key, 1, 60).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    const afterReset = memoryRateLimit(key, 1, 60);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(0);
  });

  it("keeps separate counters for separate keys", () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    memoryRateLimit(a, 1, 60);
    const blockedA = memoryRateLimit(a, 1, 60);
    const allowedB = memoryRateLimit(b, 1, 60);

    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// clientKeyFromRequest
// ---------------------------------------------------------------------------

describe("clientKeyFromRequest", () => {
  it("prefers the authenticated userId when provided", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(clientKeyFromRequest(req, "scope", "user-1")).toBe("scope:user:user-1");
  });

  it("falls back to the first x-forwarded-for hop, trimmed", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" },
    });
    expect(clientKeyFromRequest(req, "scope")).toBe("scope:ip:1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(clientKeyFromRequest(req, "scope")).toBe("scope:ip:9.8.7.6");
  });

  it("falls back to 'unknown' when no identifying headers are present", () => {
    const req = new Request("https://example.com");
    expect(clientKeyFromRequest(req, "scope")).toBe("scope:ip:unknown");
  });
});
