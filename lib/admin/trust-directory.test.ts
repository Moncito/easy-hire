import { describe, expect, it } from "vitest";
import {
  encodeTrustDirectoryCursor,
  decodeTrustDirectoryCursor,
  isTrustComputation,
  type TrustDirectoryCursor,
} from "@/lib/admin/trust-directory";
import { TRUST_WEIGHTS_VERSION } from "@/lib/admin/trust";

describe("trust directory cursor — encode/decode round trip", () => {
  it("round-trips a real cursor", () => {
    const cursor: TrustDirectoryCursor = { trustScore: 37, id: "seeker_abc123" };
    const encoded = encodeTrustDirectoryCursor(cursor);
    const decoded = decodeTrustDirectoryCursor(encoded);
    expect(decoded).toEqual(cursor);
  });

  it("round-trips a negative and a zero score — trustScore can legitimately be 0 or the queue's own risk floor is well below it", () => {
    expect(decodeTrustDirectoryCursor(encodeTrustDirectoryCursor({ trustScore: 0, id: "x" }))).toEqual({
      trustScore: 0,
      id: "x",
    });
  });

  it("rejects garbage input rather than throwing", () => {
    expect(decodeTrustDirectoryCursor("not-base64url-json")).toBeNull();
  });

  it("rejects a well-formed envelope missing the expected fields", () => {
    const malformed = Buffer.from(JSON.stringify({ somethingElse: true }), "utf8").toString("base64url");
    expect(decodeTrustDirectoryCursor(malformed)).toBeNull();
  });

  it("rejects a cursor whose trustScore is a string, not a number", () => {
    const malformed = Buffer.from(JSON.stringify({ trustScore: "40", id: "x" }), "utf8").toString("base64url");
    expect(decodeTrustDirectoryCursor(malformed)).toBeNull();
  });
});

describe("isTrustComputation — the guard between a malformed trustSignals JSON payload and the typed TrustComputation the UI relies on to explain a score", () => {
  it("accepts a real TrustComputation shape", () => {
    const valid = {
      score: 42,
      baseline: 60,
      weightsVersion: TRUST_WEIGHTS_VERSION,
      computedAt: new Date().toISOString(),
      components: [{ key: "idVerification", contribution: -5, inputs: { status: null } }],
    };
    expect(isTrustComputation(valid)).toBe(true);
  });

  it("accepts an empty components array — a plausible real state, not a malformed one", () => {
    expect(
      isTrustComputation({
        score: 60,
        baseline: 60,
        weightsVersion: 1,
        computedAt: new Date().toISOString(),
        components: [],
      })
    ).toBe(true);
  });

  it("rejects null", () => {
    expect(isTrustComputation(null)).toBe(false);
  });

  it("rejects a plain string", () => {
    expect(isTrustComputation("not an object")).toBe(false);
  });

  it("rejects an object missing `score`", () => {
    expect(
      isTrustComputation({
        baseline: 60,
        weightsVersion: 1,
        computedAt: new Date().toISOString(),
        components: [],
      })
    ).toBe(false);
  });

  it("rejects a components array whose entries have no `key`/`contribution`", () => {
    expect(
      isTrustComputation({
        score: 60,
        baseline: 60,
        weightsVersion: 1,
        computedAt: new Date().toISOString(),
        components: [{ notAKey: true }],
      })
    ).toBe(false);
  });

  it("rejects `components` that isn't an array at all", () => {
    expect(
      isTrustComputation({
        score: 60,
        baseline: 60,
        weightsVersion: 1,
        computedAt: new Date().toISOString(),
        components: "none",
      })
    ).toBe(false);
  });
});
