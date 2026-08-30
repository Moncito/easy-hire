import { describe, expect, it } from "vitest";
import {
  escapeIcsText,
  foldIcsLine,
  formatIcsDateUtc,
  generateInterviewIcs,
  interviewIcsUid,
} from "@/lib/shared/calendar-invite";

describe("escapeIcsText", () => {
  it("escapes backslashes first so escaping characters aren't double-escaped", () => {
    expect(escapeIcsText("a\\b")).toBe("a\\\\b");
  });

  it("escapes commas and semicolons", () => {
    expect(escapeIcsText("Acme, Inc.; Suite 5")).toBe("Acme\\, Inc.\\; Suite 5");
  });

  it("escapes newlines as literal \\n", () => {
    expect(escapeIcsText("line one\nline two")).toBe("line one\\nline two");
    expect(escapeIcsText("line one\r\nline two")).toBe("line one\\nline two");
  });

  it("leaves plain text untouched", () => {
    expect(escapeIcsText("Interview with Acme")).toBe("Interview with Acme");
  });
});

describe("foldIcsLine", () => {
  it("does not fold lines at or under 75 octets", () => {
    const line = "SUMMARY:" + "a".repeat(67); // exactly 75 octets
    expect(Buffer.byteLength(line, "utf8")).toBe(75);
    expect(foldIcsLine(line)).toBe(line);
  });

  it("folds lines over 75 octets with CRLF + a single leading space on continuations", () => {
    const line = "SUMMARY:" + "a".repeat(100);
    const folded = foldIcsLine(line);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0].length).toBeLessThanOrEqual(75);
    for (const continuation of parts.slice(1)) {
      expect(continuation.startsWith(" ")).toBe(true);
    }
    // Unfolding (strip CRLF + following single space) reconstructs the original line.
    const unfolded = parts.map((part, index) => (index === 0 ? part : part.slice(1))).join("");
    expect(unfolded).toBe(line);
  });

  it("never splits a multi-byte UTF-8 character across a fold boundary", () => {
    // "é" is 2 bytes in UTF-8; pad so the boundary would otherwise land mid-character.
    const line = "SUMMARY:" + "a".repeat(66) + "é".repeat(10);
    const folded = foldIcsLine(line);
    for (const part of folded.split("\r\n")) {
      const bytes = Buffer.from(part.startsWith(" ") ? part.slice(1) : part, "utf8");
      expect(Buffer.byteLength(bytes.toString("utf8"), "utf8")).toBe(bytes.length);
    }
    const unfolded = folded
      .split("\r\n")
      .map((part, index) => (index === 0 ? part : part.slice(1)))
      .join("");
    expect(unfolded).toBe(line);
  });
});

describe("formatIcsDateUtc", () => {
  it("formats a UTC date as YYYYMMDDTHHMMSSZ", () => {
    expect(formatIcsDateUtc(new Date("2026-09-15T14:30:00.000Z"))).toBe("20260915T143000Z");
  });

  it("always emits Z (UTC) regardless of local timezone offsets baked into the Date value", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    expect(formatIcsDateUtc(date)).toBe("20260101T000000Z");
  });
});

describe("interviewIcsUid", () => {
  it("is stable for the same interview id", () => {
    expect(interviewIcsUid("interview_123")).toBe(interviewIcsUid("interview_123"));
  });

  it("differs across interview ids", () => {
    expect(interviewIcsUid("interview_123")).not.toBe(interviewIcsUid("interview_456"));
  });
});

describe("generateInterviewIcs", () => {
  const baseInput = {
    interviewId: "interview_123",
    sequence: 0,
    method: "REQUEST" as const,
    scheduledAt: new Date("2026-09-15T14:30:00.000Z"),
    durationMins: 45,
    summary: "Interview: VA role at Acme",
    organizerEmail: "hiring@acme.example",
    organizerName: "Acme Hiring",
    attendeeEmail: "candidate@example.com",
    attendeeName: "Jordan Cruz",
    dtstamp: new Date("2026-09-01T00:00:00.000Z"),
  };

  it("uses CRLF line endings throughout", () => {
    const ics = generateInterviewIcs(baseInput);
    expect(ics).toContain("\r\n");
    // No bare LF (a LF not immediately preceded by CR).
    expect(ics.replace(/\r\n/g, "")).not.toContain("\n");
  });

  it("emits UTC DTSTART/DTEND/DTSTAMP with Z suffix, DTEND offset by durationMins", () => {
    const ics = generateInterviewIcs(baseInput);
    expect(ics).toContain("DTSTART:20260915T143000Z");
    expect(ics).toContain("DTEND:20260915T151500Z"); // +45 minutes
    expect(ics).toContain("DTSTAMP:20260901T000000Z");
  });

  it("includes a stable UID derived from the interview id", () => {
    const ics = generateInterviewIcs(baseInput);
    expect(ics).toContain(`UID:${interviewIcsUid("interview_123")}`);
  });

  it("sets METHOD:REQUEST and STATUS:CONFIRMED for a scheduled/rescheduled invite", () => {
    const ics = generateInterviewIcs(baseInput);
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("sets METHOD:CANCEL and STATUS:CANCELLED for a cancellation", () => {
    const ics = generateInterviewIcs({ ...baseInput, method: "CANCEL", sequence: 1 });
    expect(ics).toContain("METHOD:CANCEL");
    expect(ics).toContain("STATUS:CANCELLED");
  });

  it("escapes commas/semicolons/newlines in free-text fields", () => {
    const ics = generateInterviewIcs({
      ...baseInput,
      location: "Suite 5, Bldg A; 2nd floor",
      description: "Bring your portfolio.\nJoin 5 minutes early.",
    });
    expect(ics).toContain("LOCATION:Suite 5\\, Bldg A\\; 2nd floor");
    expect(ics).toContain("DESCRIPTION:Bring your portfolio.\\nJoin 5 minutes early.");
  });

  it("folds long lines at 75 octets", () => {
    const ics = generateInterviewIcs({
      ...baseInput,
      summary: "Interview: " + "Senior Virtual Assistant covering ".repeat(4) + "at Acme Corporation",
    });
    for (const rawLine of ics.split("\r\n")) {
      if (rawLine.startsWith(" ")) continue; // continuation line, folded on purpose
      expect(Buffer.byteLength(rawLine, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("a reschedule keeps the same UID but increments SEQUENCE", () => {
    const scheduled = generateInterviewIcs({ ...baseInput, sequence: 0 });
    const rescheduled = generateInterviewIcs({
      ...baseInput,
      sequence: 1,
      scheduledAt: new Date("2026-09-16T09:00:00.000Z"),
    });

    const uidOf = (ics: string) => ics.match(/UID:([^\r\n]+)/)?.[1];
    const sequenceOf = (ics: string) => Number(ics.match(/SEQUENCE:(\d+)/)?.[1]);

    expect(uidOf(rescheduled)).toBe(uidOf(scheduled));
    expect(sequenceOf(rescheduled)).toBeGreaterThan(sequenceOf(scheduled));
    expect(rescheduled).toContain("DTSTART:20260916T090000Z");
  });

  it("never emits a negative SEQUENCE even if given one", () => {
    const ics = generateInterviewIcs({ ...baseInput, sequence: -5 });
    expect(ics).toContain("SEQUENCE:0");
  });
});
