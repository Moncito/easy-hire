"use client";

import { CheckCircle2, Clock, AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react";
import type { QueueSeveritySignal, SlaBand } from "./types";

/**
 * SLA band + appeal + severity chips — docs/ADMIN-CONSOLE-PLAN.md §5:
 * "No colour-only status encoding. Every SLA band, status and appeal tag
 * needs an icon plus text alongside the colour." Ember is used ONLY for the
 * RED (>24h) band, matching CLAUDE.md's "Ember only for genuine warnings"
 * rule — GREEN/AMBER use navy/marigold, never a colour outside the palette.
 *
 * RED-band escalation: every RED item used to render byte-for-byte identical
 * "SLA breached" chrome whether it was 1h or 800h overdue. CLAUDE.md reserves
 * Ember as a single flat warning colour — no deeper/brighter shade for "more
 * overdue" — so the escalation here is TEXT (exact overdue hours, `font-data`
 * like every other duration in this screen), plus an optional icon/weight
 * bump for items far past threshold. Neither touches colour, so neither
 * conflicts with the "no colour-only status encoding" rule — colour was
 * never the only signal to begin with (icon + text already covered that),
 * this just makes the text itself carry more.
 *
 * Dark mode (`admin-dark:`): applied to every export in this file, not just
 * the main badge — `AppealBadge` and `SeverityChips`' chips follow the exact
 * same bumped-fill mapping below.
 */

const SLA_COPY: Record<SlaBand, { label: string; sub: string }> = {
  GREEN: { label: "On time", sub: "< 12h" },
  AMBER: { label: "Approaching SLA", sub: "12–24h" },
  RED: { label: "SLA breached", sub: "> 24h" },
};

/**
 * Must match `QUEUE_RANKING.sla.amberUnderHours` in lib/admin/queues.ts (the
 * RED-band cutoff) — duplicated here as a literal rather than imported,
 * same as SLA_COPY's own hardcoded "24h" text above, because that file pulls
 * in `@/lib/prisma` (the real Prisma client) at module scope and importing
 * it here would drag Prisma into this client component's browser bundle.
 */
const RED_THRESHOLD_HOURS = 24;
/** ">3x the 24h cutoff" — the optional secondary, colour-free escalation cue below. */
const VERY_OVERDUE_HOURS = RED_THRESHOLD_HOURS * 3;

function formatDuration(hours: number): string {
  if (hours < 1) return "<1h";
  return `${Math.round(hours)}h`;
}

export default function SlaBadge({
  slaBand,
  dense = false,
  ageHours,
}: {
  slaBand: SlaBand;
  dense?: boolean;
  /** Optional — when supplied for a RED-band item, the badge shows exactly
   * how far past the 24h threshold it is instead of the flat "SLA breached"
   * text every RED item shared before. Omit it (as the Overview grid's
   * oldest-item tile does — it already prints the raw age right below the
   * badge) to keep the older flat rendering. */
  ageHours?: number;
}) {
  const copy = SLA_COPY[slaBand];
  // Ember (RED) is already a solid, high-contrast fill in light mode and
  // needs no dark-mode adjustment (same note as AdminHeader.tsx's own
  // pending-count badge). GREEN/AMBER's light-mode tones both lose contrast
  // on the dark surface (`#1B1F26`) the same way AdminSidebar.tsx's navy
  // active-state highlight does — swapped for a lighter fill + lighter text
  // in dark mode for the same reason, not a new color outside the palette.
  const classes =
    slaBand === "RED"
      ? "bg-ember/10 text-ember"
      : slaBand === "AMBER"
        ? "bg-marigold/15 text-[#8a5a10] admin-dark:bg-marigold/25 admin-dark:text-marigold"
        : "bg-navy/8 text-navy admin-dark:bg-navy/25 admin-dark:text-mist";
  const Icon = slaBand === "RED" ? AlertTriangle : slaBand === "AMBER" ? Clock : CheckCircle2;

  const overHours = slaBand === "RED" && ageHours != null ? Math.max(0, ageHours - RED_THRESHOLD_HOURS) : null;
  const veryOverdue = slaBand === "RED" && ageHours != null && ageHours > VERY_OVERDUE_HOURS;
  const overdueText = overHours != null ? `${formatDuration(overHours)} over` : null;

  const title =
    overHours != null && ageHours != null
      ? `${copy.label} — ${formatDuration(overHours)} past the ${RED_THRESHOLD_HOURS}h threshold (submitted ${formatDuration(ageHours)} ago)`
      : `${copy.label} (${copy.sub})`;

  const bodyText = overdueText ? (
    <>
      {copy.label} · <span className="font-data">{overdueText}</span>
    </>
  ) : dense ? (
    copy.label
  ) : (
    `${copy.label} · ${copy.sub}`
  );

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
        veryOverdue ? "font-black" : "font-bold"
      } ${classes}`}
      title={title}
    >
      <Icon className={veryOverdue ? "h-3.5 w-3.5 shrink-0" : "h-3 w-3 shrink-0"} aria-hidden="true" />
      <span className="truncate">{bodyText}</span>
    </span>
  );
}

export function AppealBadge() {
  return (
    <span
      // Same GREEN-band navy-tint-badge treatment as the main SlaBadge above
      // (bg-navy/8 text-navy -> bumped navy fill + mist text in dark mode).
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-navy/8 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy admin-dark:bg-navy/25 admin-dark:text-mist"
      title="This item was previously rejected and has been resubmitted."
    >
      <RotateCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
      Appeal
    </span>
  );
}

const SIGNAL_LABELS: Record<string, string> = {
  disposableEmailDomain: "Disposable email",
  freeMailDomainForBusiness: "Free mail domain",
  priorRejection: "Prior rejection",
  lowTrustScore: "Low trust score",
  salaryOutlier: "Salary outlier",
};

function signalLabel(signal: QueueSeveritySignal): string {
  return SIGNAL_LABELS[signal.key] ?? signal.key;
}

function signalTitle(signal: QueueSeveritySignal): string {
  if (!signal.detail) return `${signalLabel(signal)} (+${signal.contribution})`;
  const details = Object.entries(signal.detail)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
  return `${signalLabel(signal)} (+${signal.contribution}) — ${details}`;
}

/**
 * Severity is explainable (§4.2): every chip carries its own icon + text +
 * a native tooltip with the underlying detail, so a rank is always
 * interrogable, not just a bare colour or number.
 */
export function SeverityChips({ signals, max = 3 }: { signals: QueueSeveritySignal[]; max?: number }) {
  if (signals.length === 0) {
    return <span className="text-[11px] text-ink/35 admin-dark:text-mist/35">No risk signals</span>;
  }
  const shown = signals.slice(0, max);
  const extra = signals.length - shown.length;
  return (
    <span className="inline-flex max-w-full flex-nowrap items-center gap-1 overflow-hidden">
      {shown.map((s) => (
        <span
          key={s.key}
          title={signalTitle(s)}
          className="inline-flex shrink-0 items-center gap-1 truncate rounded-md bg-ink/5 px-1 py-0.5 text-[10px] font-semibold text-ink/65 admin-dark:bg-white/10 admin-dark:text-mist/65"
        >
          <ShieldAlert className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          {signalLabel(s)}
        </span>
      ))}
      {extra > 0 && (
        <span className="shrink-0 rounded-md bg-ink/5 px-1 py-0.5 text-[10px] font-semibold text-ink/50 admin-dark:bg-white/10 admin-dark:text-mist/50">
          +{extra} more
        </span>
      )}
    </span>
  );
}
