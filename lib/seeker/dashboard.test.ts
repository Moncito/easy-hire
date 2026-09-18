import { describe, expect, it } from "vitest";
import {
  countActiveApplications,
  countUpcomingInterviews,
  interviewJoinUrl,
  pickNextInterview,
} from "@/lib/seeker/dashboard";

const NOW = new Date("2026-09-19T12:00:00.000Z").getTime();
const HOUR_MS = 60 * 60 * 1000;

type Interview = { scheduledAt: Date; status: string };

function interview(hoursFromNow: number, status = "SCHEDULED"): Interview {
  return { scheduledAt: new Date(NOW + hoursFromNow * HOUR_MS), status };
}

describe("countActiveApplications", () => {
  it("counts everything except REJECTED and HIRED", () => {
    const apps = [
      { status: "APPLIED" },
      { status: "SHORTLISTED" },
      { status: "INTERVIEW" },
      { status: "HIRED" },
      { status: "REJECTED" },
    ];
    expect(countActiveApplications(apps)).toBe(3);
  });

  it("returns 0 for an empty list", () => {
    expect(countActiveApplications([])).toBe(0);
  });
});

describe("pickNextInterview", () => {
  it("returns null when there are no interviews", () => {
    expect(pickNextInterview([], NOW)).toBeNull();
  });

  it("returns null when every interview is in the past", () => {
    expect(pickNextInterview([interview(-1), interview(-24)], NOW)).toBeNull();
  });

  it("excludes cancelled interviews even if upcoming", () => {
    const cancelled = interview(1, "CANCELLED");
    expect(pickNextInterview([cancelled], NOW)).toBeNull();
  });

  it("excludes completed interviews even if scheduledAt is in the future", () => {
    const completed = interview(1, "COMPLETED");
    expect(pickNextInterview([completed], NOW)).toBeNull();
  });

  it("picks the soonest upcoming interview, not the first in the array", () => {
    const later = interview(48);
    const sooner = interview(2);
    expect(pickNextInterview([later, sooner], NOW)).toBe(sooner);
  });

  it("a tie on scheduledAt resolves to either one consistently (no throw)", () => {
    const a = interview(5);
    const b = { ...interview(5) };
    const result = pickNextInterview([a, b], NOW);
    expect(result).not.toBeNull();
  });

  it("ignores a past interview when a future one also exists", () => {
    const past = interview(-1);
    const future = interview(3);
    expect(pickNextInterview([past, future], NOW)).toBe(future);
  });
});

describe("countUpcomingInterviews", () => {
  it("matches the set pickNextInterview draws from", () => {
    const interviews = [interview(1), interview(2, "CANCELLED"), interview(-1), interview(3, "COMPLETED")];
    expect(countUpcomingInterviews(interviews, NOW)).toBe(1);
  });

  it("returns 0 for an empty list", () => {
    expect(countUpcomingInterviews([], NOW)).toBe(0);
  });
});

describe("interviewJoinUrl", () => {
  it("accepts an https URL", () => {
    expect(interviewJoinUrl("https://meet.google.com/abc-defg-hij")).toBe(
      "https://meet.google.com/abc-defg-hij"
    );
  });

  it("accepts an http URL", () => {
    expect(interviewJoinUrl("http://zoom.us/j/123456")).toBe("http://zoom.us/j/123456");
  });

  it("rejects a plain physical address", () => {
    expect(interviewJoinUrl("Unit 5, BGC, Taguig")).toBeNull();
  });

  it("rejects a javascript: scheme", () => {
    expect(interviewJoinUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects a data: scheme", () => {
    expect(interviewJoinUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects null", () => {
    expect(interviewJoinUrl(null)).toBeNull();
  });

  it("rejects undefined", () => {
    expect(interviewJoinUrl(undefined)).toBeNull();
  });

  it("rejects an empty/whitespace-only string", () => {
    expect(interviewJoinUrl("   ")).toBeNull();
  });
});
