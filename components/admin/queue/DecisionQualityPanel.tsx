import { AlertTriangle, Gauge, Scale } from "lucide-react";
import type { AdminDecisionStat, DecisionStats } from "@/lib/admin/queues";

/**
 * Reviewer quality panel — docs/ADMIN-CONSOLE-PLAN.md §4.2: "an
 * approval-after-appeal is recorded as an overturn against the original
 * decision. Overturn rate per admin is the quality metric." Reads
 * `getDecisionStats({ since })`, already computed server-side; this
 * component only renders it.
 *
 * EMBER THRESHOLD (CLAUDE.md: "Ember ONLY for genuine warnings/rejections" —
 * a merely nonzero overturn rate is not a breach): an admin (or the overall
 * window) is flagged as an elevated-overturn breach only when BOTH
 *   - overturnRate > OVERTURN_BREACH_RATE (25%), AND
 *   - rejections >= OVERTURN_BREACH_MIN_REJECTIONS (5)
 * The count gate exists because a single overturned reject out of one or two
 * total rejections is not a meaningful quality signal — it's noise from a
 * tiny sample, and CLAUDE.md is explicit that a low decision count is not a
 * breach on its own. Both constants live here, in one place, next to the
 * render logic that uses them.
 */
const OVERTURN_BREACH_RATE = 0.25;
const OVERTURN_BREACH_MIN_REJECTIONS = 5;

function isBreach(rate: number | null, rejections: number): boolean {
  return rate !== null && rejections >= OVERTURN_BREACH_MIN_REJECTIONS && rate > OVERTURN_BREACH_RATE;
}

/** `null` is deliberate — zero reject decisions in the window, never a fabricated 0%. Render an em dash + explanatory text, never "0%". */
function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

function formatWindow(since: Date): string {
  const days = Math.max(1, Math.round((Date.now() - since.getTime()) / (24 * 60 * 60 * 1000)));
  const dateLabel = since.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `Last ${days} day${days === 1 ? "" : "s"} · since ${dateLabel}`;
}

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function BreachTag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-ember/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember"
      title={`Overturn rate above ${(OVERTURN_BREACH_RATE * 100).toFixed(0)}% with at least ${OVERTURN_BREACH_MIN_REJECTIONS} reject decisions in this window`}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/5 bg-mist/60 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">{label}</p>
      <p className="mt-1 font-data text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function DecisionQualityPanel({ stats }: { stats: DecisionStats }) {
  const { byAdmin, byAction, overturns } = stats;
  const windowLabel = formatWindow(stats.since);
  const overallBreach = isBreach(overturns.overturnRate, overturns.totalRejectDecisions);
  const totalDecisions = byAdmin.reduce((sum, a) => sum + a.total, 0);

  return (
    <section className="mt-8 rounded-2xl border border-ink/5 bg-white p-5 shadow-xs" aria-labelledby="decision-quality-heading">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
            <Scale className="h-3 w-3" aria-hidden="true" />
            Reviewer quality
          </span>
          <h2 id="decision-quality-heading" className="mt-2 font-display text-xl font-bold tracking-tight text-ink">
            Decision quality
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            An approval after appeal counts as an overturn against the original decision. {windowLabel}.
          </p>
        </div>
        {overallBreach && <BreachTag label="Elevated overturn rate" />}
      </div>

      {byAdmin.length === 0 ? (
        <p className="mt-5 flex items-center gap-2 rounded-xl border border-ink/5 bg-mist/60 px-4 py-6 text-sm text-ink/50">
          <Gauge className="h-4 w-4 shrink-0 text-ink/30" aria-hidden="true" />
          No decisions in this window.
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatChip label="Total decisions" value={String(totalDecisions)} />
            <StatChip label="Reject decisions" value={String(overturns.totalRejectDecisions)} />
            <StatChip label="Overall overturn rate" value={formatRate(overturns.overturnRate)} />
          </div>

          {byAction.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {byAction.map((a) => (
                <span
                  key={a.action}
                  className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-2 py-1 text-[11px] font-semibold text-ink/60"
                >
                  {actionLabel(a.action)}
                  <span className="font-data text-ink/80">{a.count}</span>
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <caption className="sr-only">Decision counts and overturn rate per admin, {windowLabel.toLowerCase()}</caption>
              <thead>
                <tr className="border-b border-ink/5 text-left text-[10px] font-semibold uppercase tracking-wider text-ink/40">
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
                    <tr key={row.adminUserId} className="border-b border-ink/5 last:border-0">
                      <th
                        scope="row"
                        className="py-2.5 pr-3 text-left font-medium text-ink/80"
                      >
                        <span className={row.adminEmail ? "" : "italic text-ink/45"}>
                          {row.adminEmail ?? "unknown admin"}
                        </span>
                      </th>
                      <td className="py-2.5 px-3 text-right font-data text-ink/70">{row.total}</td>
                      <td className="py-2.5 px-3 text-right font-data text-ink/70">{row.approvals}</td>
                      <td className="py-2.5 px-3 text-right font-data text-ink/70">{row.rejections}</td>
                      <td className="py-2.5 px-3 text-right font-data text-ink/70">{row.overturnCount}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          <span
                            className="font-data font-semibold text-ink/80"
                            title={row.overturnRate === null ? "No reject decisions in this window" : undefined}
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
        </>
      )}
    </section>
  );
}
