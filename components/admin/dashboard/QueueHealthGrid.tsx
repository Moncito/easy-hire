import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { computeSlaBand, type QueueHealth, type QueueKind } from "@/lib/admin/queues";
import SlaBadge from "@/components/admin/queue/SlaBadge";
import { ADMIN_QUEUE_NAV_ITEMS, QUEUE_ICON_COLOR, QUEUE_KIND_ICON } from "@/components/admin/adminQueueNav";

/**
 * Band 3's richest real data (docs/ADMIN-CONSOLE-PLAN.md §4.1: "Queue depth
 * per queue with oldest-item age and SLA breach count"). Reuses, rather than
 * reinvents:
 *  - `ADMIN_QUEUE_NAV_ITEMS` / `QUEUE_ICON_COLOR` / `QUEUE_KIND_ICON`
 *    (components/admin/adminQueueNav.ts) — the exact per-queue label/href/
 *    icon/color treatment the sidebar already uses.
 *  - `SlaBadge` (components/admin/queue/SlaBadge.tsx) for the oldest-item
 *    age — the SAME GREEN/AMBER/RED (navy/marigold/ember) treatment already
 *    established for a single queue item's SLA band, applied here to each
 *    queue's oldest pending item, via the exact same `computeSlaBand`
 *    threshold function `/admin/queues` itself uses. A raw breach count is
 *    shown alongside it (Ember only when > 0 — a genuine warning, per
 *    CLAUDE.md).
 */

const KIND_ORDER: QueueKind[] = ["COMPANY", "SEEKER", "JOB", "REVIEW", "REPORT"];

function formatAge(hours: number): string {
  if (hours < 1) return "<1h";
  return `${Math.round(hours)}h`;
}

export default function QueueHealthGrid({ queueHealth }: { queueHealth: QueueHealth[] }) {
  const byKind = new Map(queueHealth.map((h) => [h.kind, h]));

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {KIND_ORDER.map((kind) => {
        const nav = ADMIN_QUEUE_NAV_ITEMS.find((item) => item.kind === kind);
        const health = byKind.get(kind);
        const Icon = QUEUE_KIND_ICON[kind];
        const iconColor = QUEUE_ICON_COLOR[kind];
        const depth = health?.depth ?? 0;
        const breaches = health?.slaBreaches ?? 0;

        return (
          <Link
            key={kind}
            href={nav?.href ?? "/admin/queues"}
            className="group flex flex-col gap-3 rounded-2xl border border-ink/5 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/10 admin-dark:bg-white/5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/55 admin-dark:text-mist/55">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} strokeWidth={2} aria-hidden="true" />
                {nav?.label ?? kind}
              </span>
              {breaches > 0 && (
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ember/10 px-1.5 py-0.5 text-[10px] font-bold text-ember"
                  title={`${breaches} item${breaches === 1 ? "" : "s"} over the 24h SLA`}
                >
                  <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {breaches}
                </span>
              )}
            </div>

            <div>
              <p className="font-data text-3xl font-bold text-ink admin-dark:text-mist">{depth}</p>
              <p className="text-xs text-ink/45 admin-dark:text-mist/45">pending</p>
            </div>

            <div className="mt-auto border-t border-ink/5 pt-2.5 admin-dark:border-white/10">
              {health?.oldestAgeHours != null ? (
                <div className="flex flex-col gap-1">
                  <SlaBadge slaBand={computeSlaBand(health.oldestAgeHours)} dense />
                  <span className="font-data text-[10px] text-ink/40 admin-dark:text-mist/40">
                    Oldest item: {formatAge(health.oldestAgeHours)}
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-ink/40 admin-dark:text-mist/40">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                  Queue is empty
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
