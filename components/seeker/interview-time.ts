import { interviewFormatLabel } from "@/lib/shared/interview-format";

// Re-exported so callers only need one import for interview display helpers.
export { interviewFormatLabel };

const MANILA_TIME_ZONE = "Asia/Manila";

/**
 * Interviews are scheduled by US/AU/UK employers but stored in UTC
 * (docs/build-plan.md: "Store UTC in DB; display employer-local + PHT in
 * messaging and scheduling"). The seeker dashboard has no employer-local
 * timezone to show alongside it (that's not part of the narrow
 * `SeekerInterview` payload), so this renders unambiguously in the
 * candidate's own timezone — Asia/Manila — with an explicit "PHT" suffix so
 * nobody has to guess which clock a bare time refers to.
 */
export function formatInterviewTimePHT(date: Date): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return `${formatted} PHT`;
}

export function formatInterviewDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
