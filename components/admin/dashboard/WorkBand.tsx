import { CircleDashed } from "lucide-react";
import type { Work } from "@/lib/admin/home-dashboard";
import QueueHealthGrid from "./QueueHealthGrid";
import TodayDecisionsPanel from "./TodayDecisionsPanel";
import RecentOverturnsPanel from "./RecentOverturnsPanel";

/**
 * Band 3 — Work (docs/ADMIN-CONSOLE-PLAN.md §4.1). Queue health is visible
 * to every admin; `decisionStats`/`recentOverturns` are `PermissionGated<T>`
 * (gated on `queue.decide` in `lib/admin/home-dashboard.ts`, for the same
 * reviewer-performance-leak reason `/admin/queues` already gates
 * `getDecisionStats`). A `"restricted"` state renders as an explicit,
 * visible note carrying its own reason — never silently hidden, never a
 * blank section — using the same dashed/neutral visual language as
 * `components/admin/system/NotInstrumentedPanel.tsx` and Band 1/2's own
 * null/blocked states, so every "we can't show you this" moment on this
 * page reads as the same kind of thing.
 */

function RestrictedNotice({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-4 admin-dark:border-white/15 admin-dark:bg-white/5">
      <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-ink/30 admin-dark:text-mist/40" aria-hidden="true" />
      <p className="text-sm text-ink/60 admin-dark:text-mist/60">{reason}</p>
    </div>
  );
}

export default function WorkBand({ work }: { work: Work }) {
  return (
    <section aria-labelledby="work-band-heading" className="space-y-6">
      <div>
        <h2 id="work-band-heading" className="font-display text-xl font-bold tracking-tight text-ink admin-dark:text-mist">
          Work
        </h2>
        <p className="mt-1 text-sm text-ink/55 admin-dark:text-mist/55">
          Queue depth, SLA health, and today&rsquo;s decision activity — the volume signal, checked last.
        </p>
      </div>

      <QueueHealthGrid queueHealth={work.queueHealth} />

      <div>
        <h3 className="mb-3 font-display text-base font-bold tracking-tight text-ink admin-dark:text-mist">
          Today&rsquo;s decisions
        </h3>
        {work.decisionStats.status === "ok" ? (
          <TodayDecisionsPanel stats={work.decisionStats.value} />
        ) : (
          <RestrictedNotice reason={work.decisionStats.reason} />
        )}
      </div>

      <div>
        <h3 className="mb-3 font-display text-base font-bold tracking-tight text-ink admin-dark:text-mist">
          Recent overturns
        </h3>
        {work.recentOverturns.status === "ok" ? (
          <RecentOverturnsPanel overturns={work.recentOverturns.value} />
        ) : (
          <RestrictedNotice reason={work.recentOverturns.reason} />
        )}
      </div>
    </section>
  );
}
