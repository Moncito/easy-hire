import type { EmployerAnalytics } from "@/lib/employer/analytics";

/**
 * "Needs your attention" on the Pro dashboard: one ranked list of things
 * that want an action today. It replaces four places that each repeated
 * "1 applicant waiting for review" (Easy AI line, dark pill, pink banner,
 * sidebar tile) and surfaces the detail those buried — how long the oldest
 * applicant has waited.
 *
 * Pure: derived from analytics already loaded for the page.
 */

export type DashboardAttentionItem = {
  id: "needs-review" | "unread-messages" | "quiet-roles";
  title: string;
  detail: string | null;
  href: string;
  actionLabel: string;
  /** "warning" only when something has actually gone stale; routine items stay neutral. */
  tone: "warning" | "neutral";
};

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function buildDashboardAttention(
  analytics: Pick<EmployerAnalytics, "metrics" | "unreadMessages" | "activeJobs">
): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];
  const { metrics } = analytics;

  if (metrics.needsReview > 0) {
    const age = metrics.oldestUnreviewedAgeDays;
    items.push({
      id: "needs-review",
      title: `${plural(metrics.needsReview, "applicant")} waiting for review`,
      detail: age !== null && age >= 1 ? `Oldest has waited ${plural(age, "day")}` : null,
      href: "/employer/applicants?filter=NEEDS_REVIEW",
      actionLabel: "Review",
      tone: metrics.hasOverdueUnreviewed ? "warning" : "neutral",
    });
  }

  if (analytics.unreadMessages > 0) {
    items.push({
      id: "unread-messages",
      title: `${plural(analytics.unreadMessages, "unread message")}`,
      detail: null,
      href: "/employer/messages",
      actionLabel: "Open",
      tone: "neutral",
    });
  }

  const quietRoles = analytics.activeJobs.filter((job) => job.status === "ACTIVE" && job.applicantCount === 0);
  if (quietRoles.length > 0) {
    items.push({
      id: "quiet-roles",
      title: `${plural(quietRoles.length, "live role")} with no applicants yet`,
      detail:
        quietRoles.length === 1
          ? `${quietRoles[0].title}. Sharing the listing usually helps.`
          : "Sharing the listings usually helps.",
      href: "/employer/jobs",
      actionLabel: "See roles",
      tone: "neutral",
    });
  }

  // Stale items first; otherwise keep the order above (review, messages, reach).
  return items.sort((a, b) => Number(b.tone === "warning") - Number(a.tone === "warning"));
}

/** Median minutes to first employer response, as a compact label. Null until the nightly rollup has enough data. */
export function formatResponseTime(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h`;
  const days = minutes / (24 * 60);
  return `${days < 10 ? days.toFixed(1).replace(/\.0$/, "") : Math.round(days)}d`;
}
