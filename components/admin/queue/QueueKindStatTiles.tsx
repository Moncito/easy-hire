import { CircleDashed } from "lucide-react";
import type { QueueKind, QueueKindStats } from "@/lib/admin/queues";

/**
 * The 4-tile stat row at the top of `/admin/queues/[kind]`
 * (`getQueueKindStats()` in lib/admin/queues.ts). Neither existing tile
 * primitive in `components/admin/statTiles.tsx` fits: `StatTile` and
 * `StatTileCompact` are both single label+value shapes, and every tile here
 * needs a label, a headline, AND an explanatory sub-line. Rather than bolt a
 * third shape onto that file (whose own doc comment says the two existing
 * variants are staying visually distinct on purpose, not being merged), this
 * is a new, narrowly-scoped primitive — but copies `StatTile`'s container
 * (rounded-xl, border-ink/5, bg-mist/60, the same `admin-dark:` pair) and its
 * `font-data` treatment for the headline number, so it reads as a sibling of
 * that component rather than a foreign one bolted onto this page.
 */

function Tile({
  label,
  headline,
  sub,
}: {
  label: string;
  headline: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/5 bg-mist/60 px-4 py-3 admin-dark:border-white/10 admin-dark:bg-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">{label}</p>
      <p className="mt-1 font-data text-xl font-bold text-ink admin-dark:text-mist">{headline}</p>
      <p className="mt-1 text-[11px] text-ink/50 admin-dark:text-mist/50">{sub}</p>
    </div>
  );
}

/** Same "<1h" floor as `QueueHealthGrid.tsx`'s `formatAge` — never a misleading bare "0h". */
function formatOldestOver(hours: number | null): string {
  if (hours === null) return "No items breached";
  if (hours < 1) return "oldest: <1h over";
  return `oldest: ${Math.round(hours)}h over`;
}

/**
 * `null` here means "not tracked for this kind" (see
 * `QueueKindStats.medianDecisionHours`'s doc comment) — never rendered as
 * "0h" or a bare em dash, which would both read as a real, if boring,
 * measurement instead of "we have no data". Rendered with the same dashed,
 * `CircleDashed`-marked chip `NotInstrumentedPanel.tsx` uses for its own
 * "we don't measure this yet" rows, just carrying this tile's own copy.
 */
function MedianHeadline({ medianDecisionHours }: { medianDecisionHours: number | null }) {
  if (medianDecisionHours === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/50 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/55">
        <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Not tracked yet
      </span>
    );
  }
  return <>{medianDecisionHours.toFixed(1)}h</>;
}

/**
 * Tile 4's wording (docs comment on `QUEUE_KIND_DECISION_ACTIONS` in
 * lib/admin/queues.ts): only COMPANY/SEEKER/JOB are a real approve/reject
 * pair. REVIEW's decisions are "keep the disputed review public" vs. "take
 * it down" — Restored/hidden, not Approved/Rejected. REPORT's are "acted on
 * the report" vs. "found no violation" — Actioned/dismissed.
 */
const WEEKLY_TILE_COPY: Record<QueueKind, { positiveLabel: string; negativeWord: string }> = {
  COMPANY: { positiveLabel: "Approved this week", negativeWord: "rejected" },
  SEEKER: { positiveLabel: "Approved this week", negativeWord: "rejected" },
  JOB: { positiveLabel: "Approved this week", negativeWord: "rejected" },
  REVIEW: { positiveLabel: "Restored this week", negativeWord: "hidden" },
  REPORT: { positiveLabel: "Actioned this week", negativeWord: "dismissed" },
};

export default function QueueKindStatTiles({ kind, stats }: { kind: QueueKind; stats: QueueKindStats }) {
  const {
    pendingCount,
    pendingBreached,
    pendingOnTime,
    slaBreachedCount,
    oldestOverHours,
    medianDecisionHours,
    approvedThisWeek,
    rejectedThisWeek,
  } = stats;
  const weeklyCopy = WEEKLY_TILE_COPY[kind];

  return (
    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        label="Pending review"
        headline={pendingCount}
        sub={`${pendingBreached} breached, ${pendingOnTime} on time`}
      />
      <Tile
        label="SLA breached"
        headline={
          <span className={slaBreachedCount > 0 ? "text-ember" : undefined}>{slaBreachedCount}</span>
        }
        sub={formatOldestOver(oldestOverHours)}
      />
      <Tile
        label="Median time to decision"
        headline={<MedianHeadline medianDecisionHours={medianDecisionHours} />}
        sub={medianDecisionHours === null ? "Not tracked for this queue yet — Job approvals only, for now." : "last 30 days"}
      />
      <Tile
        label={weeklyCopy.positiveLabel}
        headline={approvedThisWeek}
        sub={`${rejectedThisWeek} ${weeklyCopy.negativeWord}`}
      />
    </div>
  );
}
