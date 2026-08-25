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

  it("gives job posting/editing to owners and recruiters only", () => {
    expect(hasCollaborativePermission("OWNER", "jobs:manage")).toBe(true);
    expect(hasCollaborativePermission("RECRUITER", "jobs:manage")).toBe(true);
    expect(hasCollaborativePermission("HIRING_MANAGER", "jobs:manage")).toBe(false);
    expect(hasCollaborativePermission("VIEWER", "jobs:manage")).toBe(false);
  });

  it("gives every active role team:read — the gate used for reports and the company profile view", () => {
    for (const role of ["OWNER", "RECRUITER", "HIRING_MANAGER", "VIEWER"] as const) {
      expect(hasCollaborativePermission(role, "team:read")).toBe(true);
    }
  });

  it("owner holds company:manage, not company:read — reports/profile guards must not use company:read alone", () => {
    expect(hasCollaborativePermission("OWNER", "company:manage")).toBe(true);
    expect(hasCollaborativePermission("OWNER", "company:read")).toBe(false);
  });

  it("gives candidate messaging to owners and recruiters only", () => {
    expect(hasCollaborativePermission("OWNER", "messages:manage")).toBe(true);
    expect(hasCollaborativePermission("RECRUITER", "messages:manage")).toBe(true);
    expect(hasCollaborativePermission("HIRING_MANAGER", "messages:manage")).toBe(false);
    expect(hasCollaborativePermission("VIEWER", "messages:manage")).toBe(false);
  });
});
