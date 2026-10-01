import { describe, expect, it } from "vitest";
import { formatActivityTime, groupByCandidate, stageMoveText } from "@/lib/employer/dashboard-decisions";

const now = new Date("2026-09-30T12:00:00.000Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

describe("formatActivityTime", () => {
  it("uses relative time under 14 days and a date after", () => {
    expect(formatActivityTime(ago(10_000), now)).toBe("Just now");
    expect(formatActivityTime(ago(12 * MIN), now)).toBe("12m ago");
    expect(formatActivityTime(ago(5 * 60 * MIN), now)).toBe("5h ago");
    expect(formatActivityTime(ago(9 * DAY), now)).toBe("9d ago");
    expect(formatActivityTime(new Date("2026-08-22T12:00:00.000Z"), now)).toBe("Aug 22");
  });
});

describe("groupByCandidate", () => {
  const row = (
    seekerId: string,
    name: string,
    applicationId: string,
    status: "APPLIED" | "SHORTLISTED" | "INTERVIEW"
  ) => ({ applicationId, jobId: `job-${applicationId}`, role: `Role ${applicationId}`, status, seekerId, name, photoUrl: null });

  it("puts one candidate on one row with every open application", () => {
    const grouped = groupByCandidate([
      row("s1", "Scaredy", "a1", "APPLIED"),
      row("s1", "Scaredy", "a2", "INTERVIEW"),
      row("s1", "Scaredy", "a3", "SHORTLISTED"),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].applications.map((a) => a.status)).toEqual(["INTERVIEW", "SHORTLISTED", "APPLIED"]);
  });

  it("orders candidates by how far along they are, then by how many roles", () => {
    const grouped = groupByCandidate([
      row("s1", "Applied only", "a1", "APPLIED"),
      row("s2", "Interviewing", "a2", "INTERVIEW"),
      row("s3", "Two roles", "a3", "INTERVIEW"),
      row("s3", "Two roles", "a4", "APPLIED"),
    ]);
    expect(grouped.map((c) => c.name)).toEqual(["Two roles", "Interviewing", "Applied only"]);
  });
});

describe("stageMoveText", () => {
  it("describes each move in plain words", () => {
    expect(stageMoveText("INTERVIEW", "Bookkeeper")).toBe("moved to interview for Bookkeeper");
    expect(stageMoveText("HIRED", "Bookkeeper")).toBe("was hired for Bookkeeper");
    expect(stageMoveText("REJECTED", "Bookkeeper")).toBe("was declined for Bookkeeper");
  });
});
