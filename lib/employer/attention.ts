/**
 * How urgent a wait is, shared by every "waiting" indicator in the employer
 * workspace (decision queue, KPI tile, roles table, attention banners):
 *  - under 3 days: routine, no highlight
 *  - 3 days and over: marigold reminder
 *  - over 14 days: Ember — the decision target has been missed
 * One function so no two components disagree about when something is late.
 */

export const ATTENTION_AFTER_DAYS = 3;
export const CRITICAL_AFTER_DAYS = 14;

export type WaitSeverity = "none" | "attention" | "critical";

export function waitSeverity(days: number | null | undefined): WaitSeverity {
  if (days === null || days === undefined) return "none";
  if (days > CRITICAL_AFTER_DAYS) return "critical";
  if (days >= ATTENTION_AFTER_DAYS) return "attention";
  return "none";
}
