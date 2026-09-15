import Link from "next/link";
import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { AlertTriangle, ArrowRight, Clock, Layers } from "lucide-react";
import { getQueueHealth, getDecisionStats, type QueueHealth, type QueueKind } from "@/lib/admin/queues";
import { QUEUE_KIND_LABEL, QUEUE_SEGMENT_BY_KIND } from "./_lib/kind-map";
import DecisionQualityPanel from "@/components/admin/queue/DecisionQualityPanel";

const KIND_ORDER: QueueKind[] = ["COMPANY", "SEEKER", "JOB", "REVIEW"];

const KIND_DESCRIPTION: Record<QueueKind, string> = {
  COMPANY: "Employer identity verification",
  SEEKER: "VA identity verification",
  JOB: "Job posting approval",
  REVIEW: "Disputed review resolution",
};

export default async function AdminQueuesIndexPage() {
  // `queue.decide`, not a bare admin check. This page server-renders
  // `getDecisionStats()`, which carries other admins' emails and their
  // per-admin overturn rates — reviewer performance data. Gating only
  // GET /api/admin/queues/stats would have left this page handing it to any
  // SUPPORT or FINANCE admin who navigated here (§8.1).
  await requireAdminPagePermission("queue.decide");

  // No `since` argument: getDecisionStats owns the default window
  // (DEFAULT_DECISION_STATS_WINDOW_DAYS in lib/admin/queues.ts) and reports
  // back which window it used as `stats.since`, which is what the panel
  // renders as its label. Computing the cutoff here instead would both
  // duplicate that constant and read the clock during render, which
  // react-hooks/purity rejects — server component or not.
  const [health, decisionStats] = await Promise.all([getQueueHealth(), getDecisionStats()]);
  const byKind = new Map<QueueKind, QueueHealth>(health.map((h) => [h.kind, h]));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Operations / Queues</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Moderation queues</h1>
        <p className="mt-2 text-sm text-ink/55">
          Risk-ranked, not first-in-first-out. Pick a queue to review documents side-by-side with the decision, or
          bulk-act on everything at once.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KIND_ORDER.map((kind) => {
          const h = byKind.get(kind);
          const breached = (h?.slaBreaches ?? 0) > 0;
          return (
            <Link
              key={kind}
              href={`/admin/queues/${QUEUE_SEGMENT_BY_KIND[kind]}`}
              className="group flex flex-col justify-between rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                    <Layers className="h-3 w-3" aria-hidden="true" />
                    {QUEUE_KIND_LABEL[kind]}
                  </span>
                  <ArrowRight
                    className="h-4 w-4 text-ink/25 transition-transform group-hover:translate-x-0.5 group-hover:text-navy"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 text-xs text-ink/50">{KIND_DESCRIPTION[kind]}</p>
                <p className="mt-2 font-data text-3xl font-bold text-ink">{h?.depth ?? 0}</p>
                <p className="text-xs text-ink/45">pending</p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3 text-xs">
                <span className="inline-flex items-center gap-1 text-ink/50">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Oldest{" "}
                  <span className="font-data font-semibold text-ink/70">
                    {h?.oldestAgeHours === null || h?.oldestAgeHours === undefined ? "—" : `${Math.round(h.oldestAgeHours)}h`}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider ${
                    breached ? "bg-ember/10 text-ember" : "bg-navy/8 text-navy"
                  }`}
                  title={breached ? "Items over the 24h SLA" : "No SLA breaches"}
                >
                  {breached && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />}
                  {h?.slaBreaches ?? 0} breached
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <DecisionQualityPanel stats={decisionStats} />
    </div>
  );
}
