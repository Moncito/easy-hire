/**
 * Hand-rolled RFC 5545 (iCalendar) generator for interview invites — no
 * dependency, deliberately minimal. Only what the interview-scheduling flow
 * needs: a single VEVENT per invite, REQUEST for create/update, CANCEL for
 * cancellation.
 *
 * Interview times are stored in UTC in the database (see prisma/schema.prisma
 * Interview.scheduledAt). Employers are US/AU/UK and candidates are
 * PH-based (docs/build-plan.md), so every timestamp in the generated file is
 * emitted in UTC (`...Z`) — calendar clients localize on display, which is
 * the only representation that's unambiguously correct for both sides.
 */

const CRLF = "\r\n";
const FOLD_LIMIT_OCTETS = 75;

/**
 * Escapes a TEXT value per RFC 5545 §3.3.11: backslash, then comma,
 * semicolon, and newlines. Order matters — backslash must be escaped first
 * or the escaping backslashes themselves would get double-escaped.
 */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n/g, "\\n")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\n");
}

/**
 * Folds a single unfolded content line to RFC 5545 §3.1: lines longer than
 * 75 octets (not characters — UTF-8 byte length) are split, with each
 * continuation line prefixed by a single space. Splits are byte-safe: a
 * multi-byte UTF-8 character is never cut in half.
 */
export function foldIcsLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= FOLD_LIMIT_OCTETS) return line;

  const chunks: string[] = [];
  let start = 0;
  let isFirst = true;

  while (start < bytes.length) {
    const limit = isFirst ? FOLD_LIMIT_OCTETS : FOLD_LIMIT_OCTETS - 1; // continuation lines lose 1 octet to the leading space
    let end = Math.min(start + limit, bytes.length);
    // Back off if we'd split a multi-byte UTF-8 sequence (continuation bytes are 10xxxxxx = 0x80-0xBF).
    while (end > start + 1 && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(bytes.slice(start, end).toString("utf8"));
    start = end;
    isFirst = false;
  }

  return chunks.map((chunk, index) => (index === 0 ? chunk : " " + chunk)).join(CRLF);
}

/** `Date` -> `YYYYMMDDTHHMMSSZ`, always UTC per DB storage. */
export function formatIcsDateUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function foldedLines(lines: string[]): string {
  return lines.map(foldIcsLine).join(CRLF);
}

export type InterviewIcsMethod = "REQUEST" | "CANCEL";

export type InterviewIcsInput = {
  /** Stable per interview — same interview id must always produce the same UID so a reschedule updates the existing entry instead of creating a duplicate. */
  interviewId: string;
  /** Monotonically non-decreasing per UID; bump on every reschedule/cancel per RFC 5545 §3.8.7.4. */
  sequence: number;
  method: InterviewIcsMethod;
  scheduledAt: Date;
  durationMins: number;
  summary: string;
  description?: string;
  location?: string;
  organizerEmail: string;
  organizerName?: string;
  attendeeEmail: string;
  attendeeName?: string;
  /** Defaults to `new Date()`; overridable for deterministic tests. */
  dtstamp?: Date;
};

export function interviewIcsUid(interviewId: string): string {
  return `interview-${interviewId}@easyhire.io`;
}

/** Builds a full VCALENDAR document (REQUEST or CANCEL) for one interview. */
export function generateInterviewIcs(input: InterviewIcsInput): string {
  const {
    interviewId,
    sequence,
    method,
    scheduledAt,
    durationMins,
    summary,
    description,
    location,
    organizerEmail,
    organizerName,
    attendeeEmail,
    attendeeName,
    dtstamp = new Date(),
  } = input;

  const uid = interviewIcsUid(interviewId);
  const dtStart = formatIcsDateUtc(scheduledAt);
  const dtEnd = formatIcsDateUtc(new Date(scheduledAt.getTime() + durationMins * 60_000));
  const status = method === "CANCEL" ? "CANCELLED" : "CONFIRMED";

  const organizerParam = organizerName ? `;CN=${escapeIcsText(organizerName)}` : "";
  const attendeeParam = attendeeName ? `;CN=${escapeIcsText(attendeeName)}` : "";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EasyHire VA Solutions//Interview Scheduling//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDateUtc(dtstamp)}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    ...(description ? [`DESCRIPTION:${escapeIcsText(description)}`] : []),
    ...(location ? [`LOCATION:${escapeIcsText(location)}`] : []),
    `STATUS:${status}`,
    `SEQUENCE:${Math.max(0, Math.trunc(sequence))}`,
    `ORGANIZER${organizerParam}:mailto:${organizerEmail}`,
    `ATTENDEE${attendeeParam};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${attendeeEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return foldedLines(lines) + CRLF;
}
