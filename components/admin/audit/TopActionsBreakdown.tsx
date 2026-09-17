import type { SerializedAdminAuditLogStats } from "./types";

/**
 * Compact "top actions" breakdown for the `/admin/audit` stat row — a ranked
 * list with an inline count bar per row, not a chart-card treatment
 * (lib/admin/audit.ts / AuditLogTable.tsx: "density over decoration").
 *
 * Unlike `ScoreDistributionChart.tsx`'s four fixed, mutually-exclusive risk
 * bands (a natural fit for one stacked bar that sums to a whole population),
 * `topActions` is an open-ended ranked list (up to 8 of however many
 * distinct actions exist) that doesn't sum to a meaningful "whole" — a
 * bar-per-row list scaled to the top count reads better here than forcing it
 * into a single segmented bar, and stays a small ranked list rather than a
 * legend.
 *
 * No `sr-only` table fallback / `role="img"` needed the way
 * `ScoreDistributionChart` needs one: every value here is already plain
 * visible text (label + count), so a screen reader gets the full content for
 * free — only the decorative width bar itself is `aria-hidden`.
 */

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export default function TopActionsBreakdown({
  topActions,
}: {
  topActions: SerializedAdminAuditLogStats["topActions"];
}) {
  if (topActions.length === 0) return null;

  const maxCount = Math.max(...topActions.map((a) => a.count));

  return (
    <div className="rounded-xl border border-ink/5 bg-white p-3 admin-dark:border-white/10 admin-dark:bg-admin-dark-surface">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">
        Top actions (all time)
      </p>
      <ul className="mt-2 space-y-1">
        {topActions.map((a) => (
          <li key={a.action} className="flex items-center gap-2">
            <span
              className="w-36 shrink-0 truncate text-[11px] font-medium text-ink/70 admin-dark:text-mist/70"
              title={actionLabel(a.action)}
            >
              {actionLabel(a.action)}
            </span>
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/5 admin-dark:bg-white/10"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-navy/50 admin-dark:bg-teal/60"
                style={{ width: `${Math.max((a.count / maxCount) * 100, 4)}%` }}
              />
            </span>
            <span className="w-12 shrink-0 text-right font-data text-[11px] font-semibold text-ink admin-dark:text-mist">
              {a.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
