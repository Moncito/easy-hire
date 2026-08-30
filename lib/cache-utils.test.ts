import { describe, expect, it } from "vitest";
import { reviveDates } from "@/lib/cache-utils";

describe("reviveDates", () => {
  const iso = "2026-08-30T12:00:00.000Z";

  describe("cache hit — value came back through unstable_cache's JSON round-trip", () => {
    it("turns an ISO string back into a Date", () => {
      const revived = reviveDates({ appliedAt: iso });
      expect(revived.appliedAt).toBeInstanceOf(Date);
      expect((revived.appliedAt as unknown as Date).toISOString()).toBe(iso);
    });

    it("revives dates nested in arrays and sub-objects", () => {
      const revived = reviveDates({
        applications: [{ job: { publishedAt: iso } }],
      });
      const publishedAt = revived.applications[0].job.publishedAt;
      expect(publishedAt).toBeInstanceOf(Date);
    });

    it("leaves non-date strings alone", () => {
      const revived = reviveDates({ title: "2026 hiring plan", id: "abc" });
      expect(revived.title).toBe("2026 hiring plan");
      expect(revived.id).toBe("abc");
    });
  });

  describe("cache miss — value came straight from Prisma and was never serialized", () => {
    // Regression: `typeof new Date() === "object"` and a Date has no own
    // enumerable properties, so an unguarded object branch rebuilt it as `{}`.
    // That crashed the seeker dashboard on its first uncached render with
    // "app.appliedAt.toISOString is not a function".
    it("passes a real Date through untouched instead of flattening it to {}", () => {
      const appliedAt = new Date(iso);
      const revived = reviveDates({ appliedAt });

      expect(revived.appliedAt).toBeInstanceOf(Date);
      expect(revived.appliedAt.toISOString()).toBe(iso);
    });

    it("preserves Dates nested in arrays and sub-objects", () => {
      const revived = reviveDates({
        applications: [{ appliedAt: new Date(iso), job: { publishedAt: new Date(iso) } }],
      });

      expect(revived.applications[0].appliedAt).toBeInstanceOf(Date);
      expect(revived.applications[0].job.publishedAt.toISOString()).toBe(iso);
    });

    it("preserves a bare Date passed in at the top level", () => {
      expect(reviveDates(new Date(iso))).toBeInstanceOf(Date);
    });
  });

  describe("mixed and edge inputs", () => {
    it("handles a payload holding both a revived string and a live Date", () => {
      const revived = reviveDates({ createdAt: iso, updatedAt: new Date(iso) });
      expect(revived.createdAt).toBeInstanceOf(Date);
      expect(revived.updatedAt).toBeInstanceOf(Date);
    });

    it("passes null, undefined, and primitives through", () => {
      expect(reviveDates(null)).toBeNull();
      expect(reviveDates(undefined)).toBeUndefined();
      expect(reviveDates(42)).toBe(42);
      expect(reviveDates(false)).toBe(false);
    });
  });
});
