"use client";

import { CheckCircle2, Clock, AlertTriangle, RotateCcw, ShieldAlert } from "lucide-react";
import type { QueueSeveritySignal, SlaBand } from "./types";

/**
 * SLA band + appeal + severity chips — docs/ADMIN-CONSOLE-PLAN.md §5:
 * "No colour-only status encoding. Every SLA band, status and appeal tag
 * needs an icon plus text alongside the colour." Ember is used ONLY for the
 * RED (>24h) band, matching CLAUDE.md's "Ember only for genuine warnings"
 * rule — GREEN/AMBER use navy/marigold, never a colour outside the palette.
 */

const SLA_COPY: Record<SlaBand, { label: string; sub: string }> = {
  GREEN: { label: "On time", sub: "< 12h" },
  AMBER: { label: "Approaching SLA", sub: "12–24h" },
  RED: { label: "SLA breached", sub: "> 24h" },
};

export default function SlaBadge({ slaBand, dense = false }: { slaBand: SlaBand; dense?: boolean }) {
  const copy = SLA_COPY[slaBand];
  const classes =
    slaBand === "RED"
      ? "bg-ember/10 text-ember"
      : slaBand === "AMBER"
        ? "bg-marigold/15 text-[#8a5a10]"
        : "bg-navy/8 text-navy";
  const Icon = slaBand === "RED" ? AlertTriangle : slaBand === "AMBER" ? Clock : CheckCircle2;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}
      title={`${copy.label} (${copy.sub})`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {dense ? copy.label : `${copy.label} · ${copy.sub}`}
    </span>
  );
}

export function AppealBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-navy/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy"
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
    return <span className="text-[11px] text-ink/35">No risk signals</span>;
  }
  const shown = signals.slice(0, max);
  const extra = signals.length - shown.length;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((s) => (
        <span
          key={s.key}
          title={signalTitle(s)}
          className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink/65"
        >
          <ShieldAlert className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          {signalLabel(s)}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink/50">+{extra} more</span>
      )}
    </span>
  );
}
