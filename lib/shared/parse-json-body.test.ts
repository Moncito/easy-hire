import { describe, expect, it } from "vitest";
import { parseJsonBody } from "@/lib/shared/parse-json-body";
import { ApiError } from "@/lib/shared/api-error";

// ---------------------------------------------------------------------------
// parseJsonBody — the malformed-body case must become a 400 ApiError instead
// of an uncaught SyntaxError bubbling up into a 500 (see app/api/register
// and friends, which all delegate to errorResponse()).
// ---------------------------------------------------------------------------

describe("parseJsonBody", () => {
  it("returns the parsed body for valid JSON", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.com" }),
    });
    await expect(parseJsonBody(req)).resolves.toEqual({ email: "a@b.com" });
  });

  it("throws a 400 ApiError for truncated/malformed JSON", async () => {
    const makeReq = () =>
      new Request("https://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      });

    await expect(parseJsonBody(makeReq())).rejects.toBeInstanceOf(ApiError);
    await expect(parseJsonBody(makeReq())).rejects.toMatchObject({ status: 400 });
  });

  it("throws a 400 ApiError for an empty body", async () => {
    await expect(parseJsonBody(new Request("https://example.com", { method: "POST" }))).rejects.toBeInstanceOf(
      ApiError
    );
    await expect(
      parseJsonBody(new Request("https://example.com", { method: "POST" }))
    ).rejects.toMatchObject({ status: 400 });
  });
});
