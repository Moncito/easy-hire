import { describe, expect, it } from "vitest";
import { hasCollaborativePermission } from "@/lib/collaborative-hiring";

describe("collaborative hiring permissions", () => {
  it("reserves team administration for owners", () => {
    expect(hasCollaborativePermission("OWNER", "team:manage")).toBe(true);
    expect(hasCollaborativePermission("RECRUITER", "team:manage")).toBe(false);
    expect(hasCollaborativePermission("HIRING_MANAGER", "team:manage")).toBe(false);
  });

  it("keeps viewers read-only", () => {
    expect(hasCollaborativePermission("VIEWER", "scorecards:read")).toBe(true);
    expect(hasCollaborativePermission("VIEWER", "scorecards:own")).toBe(false);
  });
});
