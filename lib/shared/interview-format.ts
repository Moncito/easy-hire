/**
 * `Interview.format` is a bare `String` in the schema (default `"VIDEO"`),
 * not an enum — see prisma/schema.prisma. This maps the known values used
 * by the hiring UI (components/hiring/InterviewPanel.tsx) to display labels
 * without assuming the column can only ever hold those three values.
 */
export function interviewFormatLabel(format: string): string {
  switch (format) {
    case "VIDEO":
      return "Video call";
    case "PHONE":
      return "Phone call";
    case "IN_PERSON":
      return "In person";
    default:
      return format
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");
  }
}

/**
 * Renders a scheduled time as an unambiguous UTC string for transactional
 * emails. The DB stores UTC (docs/build-plan.md: employers are US/AU/UK,
 * talent is PH) — showing a bare local-feeling string risks either side
 * misreading it, so emails are explicit about the offset. The attached .ics
 * file is what calendar apps use to localize the event correctly on import.
 */
export function formatInterviewWhenUtc(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatted} UTC`;
}
