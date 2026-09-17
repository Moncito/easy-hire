import { AlertTriangle, Gauge } from "lucide-react";
import type { AdminDecisionStat, DecisionStats } from "@/lib/admin/queues";
import { StatTile } from "@/components/admin/statTiles";

/**
 * "Today: approvals, rejections, verifications, by admin" —
 * docs/ADMIN-CONSOLE-PLAN.md §4.1 Band 3. A "Today"-scoped sibling of
 * `components/admin/queue/DecisionQualityPanel.tsx` (same `DecisionStats`
 * shape from `lib/admin/queues.ts`, same overturn-breach styling and
 * null-vs-zero discipline for `overturnRate`) rather than that component
 * reused verbatim, for two concrete reasons: (1) that panel's own heading,
 * description and `windowLabel` are written for a rolling multi-day window
 * on `/admin/queues`, and would read as "Last 1 day" rather than this
 * plan's explicit "Today" framing; (2) it has no `admin-dark:` styling at
 * all yet (confirmed by reading the file — /admin/queues' own content isn't
 * dark-themed today per AdminHeader.tsx's own doc comment), and this page
 * needs full dark-mode support, so a byte-for-byte reuse would have been the
 * one light-only patch on an otherwise dark-aware page.
 *
 * `stats` is only ever passed in once the caller has already confirmed
 * `work.decisionStats.status === "ok"` (i.e. the admin holds `queue.decide`)
 * — this component has no gate of its own to enforce, matching how
 * `DecisionQualityPanel` is used on `/admin/queues`.
 */

const OVERTURN_BREACH_RATE = 0.25;
const OVERTURN_BREACH_MIN_REJECTIONS = 5;

function isBreach(rate: number | null, rejections: number): boolean {
  return rate !== null && rejections >= OVERTURN_BREACH_MIN_REJECTIONS && rate > OVERTURN_BREACH_RATE;
}

/** `null` is deliberate — zero reject decisions today, never a fabricated 0%. */
function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function BreachTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember"
      title={`Overturn rate above ${(OVERTURN_BREACH_RATE * 100).toFixed(0)}% with at least ${OVERTURN_BREACH_MIN_REJECTIONS} reject decisions today`}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function TodayDecisionsPanel({ stats }: { stats: DecisionStats }) {
  const { byAdmin, byAction, overturns } = stats;
  const overallBreach = isBreach(overturns.overturnRate, overturns.totalRejectDecisions);
  const totalDecisions = byAdmin.reduce((sum, a) => sum + a.total, 0);

  if (byAdmin.length === 0) {
    // Same dashed "informational, not broken" language as
    // MetricSparklineTile.tsx's null state and MoneyBandCard.tsx — every
    // "there's genuinely nothing here" moment on this page should read as
    // one consistent visual idea, not a fourth ad-hoc empty state.
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-ink/15 bg-mist/40 px-4 py-3 admin-dark:border-white/15 admin-dark:bg-white/5">
        <Gauge className="h-4 w-4 shrink-0 text-ink/35 admin-dark:text-mist/40" aria-hidden="true" />
        <p className="text-xs text-ink/55 admin-dark:text-mist/55">
          No approvals, rejections, or verifications recorded yet today.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-xs admin-dark:border-white/10 admin-dark:bg-white/5">
      {overallBreach && (
        <div className="mb-3 flex justify-end">
          <BreachTag label="Elevated overturn rate" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Total decisions today" value={totalDecisions} />
        <StatTile label="Reject decisions today" value={overturns.totalRejectDecisions} />
        <StatTile label="Overturn rate" value={formatRate(overturns.overturnRate)} />
      </div>

      {byAction.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {byAction.map((a) => (
            <span
              key={a.action}
              className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-2 py-1 text-[11px] font-semibold text-ink/60 admin-dark:bg-white/10 admin-dark:text-mist/65"
            >
              {actionLabel(a.action)}
              <span className="font-data text-ink/80 admin-dark:text-mist/85">{a.count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">Decision counts and overturn rate per admin, today</caption>
          <thead>
            <tr className="border-b border-ink/5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink/40 admin-dark:border-white/10 admin-dark:text-mist/40">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Admin
              </th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">
                Total
              </th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">
                Approvals
              </th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">
                Rejections
              </th>
              <th scope="col" className="py-2 px-3 text-right font-semibold">
                Overturns
              </th>
              <th scope="col" className="py-2 pl-3 text-right font-semibold">
                Overturn rate
              </th>
            </tr>
          </thead>
          <tbody>
            {byAdmin.map((row: AdminDecisionStat) => {
              const breach = isBreach(row.overturnRate, row.rejections);
              return (
                <tr key={row.adminUserId} className="border-b border-ink/5 last:border-0 admin-dark:border-white/10">
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink/80 admin-dark:text-mist/80">
                    <span className={row.adminEmail ? "" : "italic text-ink/45 admin-dark:text-mist/45"}>
                      {row.adminEmail ?? "unknown admin"}
                    </span>
                  </th>
                  <td className="py-2.5 px-3 text-right font-data text-ink/70 admin-dark:text-mist/70">
                    {row.total}
                  </td>
                  <td className="py-2.5 px-3 text-right font-data text-ink/70 admin-dark:text-mist/70">
                    {row.approvals}
                  </td>
                  <td className="py-2.5 px-3 text-right font-data text-ink/70 admin-dark:text-mist/70">
                    {row.rejections}
                  </td>
                  <td className="py-2.5 px-3 text-right font-data text-ink/70 admin-dark:text-mist/70">
                    {row.overturnCount}
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      <span
                        className="font-data font-semibold text-ink/80 admin-dark:text-mist/80"
                        title={row.overturnRate === null ? "No reject decisions today" : undefined}
                      >
                        {formatRate(row.overturnRate)}
                      </span>
                      {breach && <BreachTag label="Elevated" />}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
