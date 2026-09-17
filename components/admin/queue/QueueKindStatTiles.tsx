import { CircleDashed, TrendingDown, TrendingUp } from "lucide-react";
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
  extra,
}: {
  label: string;
  headline: React.ReactNode;
  sub: React.ReactNode;
  /** Optional row below `sub` — currently only Tile 4's weekly sparkline. Tiles 1/2/3 omit it and render exactly as before. */
  extra?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink/5 bg-mist/60 px-4 py-3 admin-dark:border-white/10 admin-dark:bg-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">{label}</p>
      <p className="mt-1 font-data text-xl font-bold text-ink admin-dark:text-mist">{headline}</p>
      <p className="mt-1 text-[11px] text-ink/50 admin-dark:text-mist/50">{sub}</p>
      {extra != null && <div className="mt-1.5">{extra}</div>}
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

function formatSignedInt(value: number): string {
  if (value > 0) return `+${value}`;
  return `${value}`; // negative already carries its own "-"; zero renders bare "0"
}

function formatSignedHours(value: number): string {
  const abs = Math.abs(value).toFixed(1);
  if (value > 0) return `+${abs}h`;
  if (value < 0) return `-${abs}h`;
  return `${abs}h`;
}

/**
 * Shared by Tile 3 (`medianDecisionHoursDelta`) and Tile 4
 * (`approvedThisWeekDelta`). Colour is driven by `positiveIsGood`, never by
 * raw sign — CLAUDE.md reserves Ember for genuine warnings/rejections, so a
 * merely-worse-than-before metric (fewer approvals, slower decisions) is
 * rendered muted ink/gray, never ember. Only a positive AND "good" delta
 * gets the teal treatment; the icon direction (Up for a positive number,
 * Down for a negative one) always matches the number's actual sign — only
 * the colour mapping flips between the two tiles.
 */
function DeltaPill({
  value,
  positiveIsGood,
  format,
  title,
}: {
  value: number;
  positiveIsGood: boolean;
  format: (value: number) => string;
  title: string;
}) {
  const isZero = value === 0;
  const isGood = positiveIsGood ? value > 0 : value < 0;
  const Icon = isZero ? null : value > 0 ? TrendingUp : TrendingDown;
  const colorClasses = isZero
    ? "text-ink/40 admin-dark:text-mist/40"
    : isGood
      ? "text-teal admin-dark:text-teal"
      : "text-ink/45 admin-dark:text-mist/45";

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-data text-[11px] font-semibold ${colorClasses}`}
      title={title}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {format(value)}
    </span>
  );
}

const SPARKLINE_WIDTH = 64;
const SPARKLINE_HEIGHT = 20;

/** Same local-calendar-day parsing as `weeklyTrend[i].day`'s own doc comment — build the `Date` from the split parts rather than `new Date(day)`, which parses a bare "YYYY-MM-DD" as UTC and can shift the label a day off depending on timezone. */
function formatSparklineDayLabel(day: string): string {
  const [y, m, d] = day.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Tile 4 only. Plots `weeklyTrend[i].positive` for all 7 days as a tiny,
 * axis-free inline line — muted throughout (`stroke-ink/25` /
 * `admin-dark:stroke-white/20`, deliberately NOT the tile's teal accent)
 * except the most recent day (index 6), which gets a small filled teal dot,
 * matching this queue UI's existing teal-means-positive/approved convention
 * (see e.g. `bg-teal` on the primary "Verify" action elsewhere in
 * components/admin/queue/). Each day gets a native `<title>` for a
 * lightweight hover tooltip — this file tree's existing convention for
 * hover detail (see `SlaBadge.tsx`), not a custom tooltip component.
 */
function WeeklySparkline({
  trend,
  verb,
}: {
  trend: QueueKindStats["weeklyTrend"];
  /** Lower-case past-tense verb for this kind's positive action — "approved" / "restored" / "actioned" — reused from `WEEKLY_TILE_COPY` so the tooltip wording matches the tile's own headline. */
  verb: string;
}) {
  const max = Math.max(...trend.map((t) => t.positive));
  // All-zero week: a flat line at zero would read as real (if boring) data
  // rather than "no approvals" — same honesty rule `MedianHeadline` above
  // follows for a missing measurement. Render nothing instead.
  if (max <= 0) return null;

  const padX = 3;
  const padTop = 5; // headroom for the endpoint dot's radius
  const padBottom = 3;
  const innerHeight = SPARKLINE_HEIGHT - padTop - padBottom;
  const xStep = (SPARKLINE_WIDTH - padX * 2) / (trend.length - 1);

  const points = trend.map((t, i) => ({
    x: padX + i * xStep,
    y: SPARKLINE_HEIGHT - padBottom - (t.positive / max) * innerHeight,
    day: t.day,
    value: t.positive,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const lastIndex = points.length - 1;

  return (
    <span
      role="img"
      aria-label={`${verb} per day, last 7 days: ${trend.map((t) => t.positive).join(", ")}`}
      className="inline-block"
    >
      <svg
        width={SPARKLINE_WIDTH}
        height={SPARKLINE_HEIGHT}
        viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
        aria-hidden="true"
        focusable="false"
      >
        <path
          d={pathD}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-ink/25 admin-dark:stroke-white/20"
        />
        {points.map((p, i) => (
          <circle
            key={p.day}
            cx={p.x}
            cy={p.y}
            r={i === lastIndex ? 4.5 : 5}
            fill={i === lastIndex ? undefined : "transparent"}
            className={i === lastIndex ? "fill-teal" : undefined}
          >
            <title>{`${formatSparklineDayLabel(p.day)}: ${p.value} ${verb}`}</title>
          </circle>
        ))}
      </svg>
    </span>
  );
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
    medianDecisionHoursDelta,
    approvedThisWeek,
    rejectedThisWeek,
    approvedThisWeekDelta,
    weeklyTrend,
  } = stats;
  const weeklyCopy = WEEKLY_TILE_COPY[kind];
  // "Approved this week" -> "approved" — reused as the sparkline tooltip's verb, so it matches this tile's own headline wording instead of hardcoding "approved" for every kind.
  const positiveVerb = weeklyCopy.positiveLabel.replace(" this week", "").toLowerCase();

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
        extra={
          medianDecisionHoursDelta !== null ? (
            // Fewer hours is the good direction here (faster decisions), so
            // `positiveIsGood` is false — a negative delta (down = faster)
            // gets the teal "good" treatment, not a positive one.
            <DeltaPill
              value={medianDecisionHoursDelta}
              positiveIsGood={false}
              format={formatSignedHours}
              title="vs previous 30 days"
            />
          ) : undefined
        }
      />
      <Tile
        label={weeklyCopy.positiveLabel}
        headline={approvedThisWeek}
        sub={`${rejectedThisWeek} ${weeklyCopy.negativeWord}`}
        extra={
          <div className="flex items-center gap-2.5">
            <WeeklySparkline trend={weeklyTrend} verb={positiveVerb} />
            <DeltaPill
              value={approvedThisWeekDelta}
              positiveIsGood={true}
              format={formatSignedInt}
              title="vs previous 7 days"
            />
          </div>
        }
      />
    </div>
  );
}
