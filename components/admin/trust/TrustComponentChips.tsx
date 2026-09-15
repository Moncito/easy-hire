"use client";

import { ShieldAlert } from "lucide-react";
import type { TrustComponent } from "./types";

/**
 * The "why" behind a trust score — docs/ADMIN-CONSOLE-PLAN.md §4.8 task
 * spec: "render trustSignals.components as a readable breakdown (key +
 * contribution, e.g. 'Rejection rate: -10'), not just the final number."
 *
 * Sorted worst (most negative) first, on purpose — this table exists to
 * explain LOW scores, so the component doing the most damage should be the
 * one a reviewer sees without hovering. Same "chip + native tooltip for the
 * full detail" shape as `SeverityChips` in components/admin/queue/SlaBadge.tsx,
 * except the contribution number is printed directly on the chip (not only
 * in the tooltip) per the task's explicit "not just the final number"
 * requirement — the visible text alone must already explain the score.
 */

function contributionLabel(key: string): string {
  // Component keys are short camelCase identifiers from lib/admin/trust.ts
  // (e.g. "idVerified", "abuseReports") — split camelCase into words, then
  // title-case each one.
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function signedNumber(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function chipTitle(c: TrustComponent): string {
  const details = Object.entries(c.inputs)
    .map(([k, v]) => `${contributionLabel(k)}: ${v}`)
    .join(", ");
  const head = `${contributionLabel(c.key)} (${signedNumber(c.contribution)})`;
  return details ? `${head} — ${details}` : head;
}

export default function TrustComponentChips({
  components,
  max = 3,
}: {
  components: TrustComponent[];
  max?: number;
}) {
  if (components.length === 0) {
    return <span className="text-[11px] text-ink/35">No components recorded</span>;
  }

  const sorted = [...components].sort((a, b) => a.contribution - b.contribution);
  const shown = sorted.slice(0, max);
  const extra = sorted.length - shown.length;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((c) => (
        <span
          key={c.key}
          title={chipTitle(c)}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
            c.contribution < 0 ? "bg-ember/8 text-ember" : c.contribution > 0 ? "bg-teal/8 text-teal" : "bg-ink/5 text-ink/50"
          }`}
        >
          {c.contribution < 0 && <ShieldAlert className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />}
          {contributionLabel(c.key)} {signedNumber(c.contribution)}
        </span>
      ))}
      {extra > 0 && (
        <span className="rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink/50">+{extra} more</span>
      )}
    </span>
  );
}
