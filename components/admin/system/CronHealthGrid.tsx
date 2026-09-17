import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import { formatDateTime } from "@/components/admin/directory/badges";
import { CRON_JOB_LABELS, staleAfterHoursFor } from "./cronMeta";
import type { SerializedCronHealthEntry } from "./types";

/**
 * Cron health — §4.10's "most operationally important block", given the most
 * visual weight on the page (large cards, first section). Per the task spec:
 * "A job whose last success is old is the thing an operator needs to spot
 * instantly" — so a card goes Ember not only when `currentStatus === "FAILED"`
 * but also when the last SUCCESS is older than `staleAfterHoursFor` allows,
 * even if the most recent run technically reported success (a job can flip
 * from failing to succeeding right at the sampling instant and still have
 * been silently broken for days beforehand — the age-of-last-success signal
 * catches that, a bare "last run status" does not).
 *
 * Colour is never the only signal: every state pairs an icon with text, per
 * CLAUDE.md/§5 ("no colour-only status encoding").
 */

function formatHours(hours: number | null): string {
  if (hours === null) return "never";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

function CronCard({ entry }: { entry: SerializedCronHealthEntry }) {
  const staleAfter = staleAfterHoursFor(entry.jobName);
  const isStale = entry.lastSuccessAgeHours !== null && entry.lastSuccessAgeHours > staleAfter;
  const isFailed = entry.currentStatus === "FAILED";
  const isBad = isFailed || isStale;
  const isRunning = entry.currentStatus === "RUNNING";
  const isNeverRun = entry.currentStatus === "NEVER_RUN";

  let StatusIcon = CheckCircle2;
  let statusLabel = "Healthy";
  let statusTone = "text-teal";
  if (isBad) {
    StatusIcon = isFailed ? XCircle : AlertTriangle;
    statusLabel = isFailed ? "Failed" : "Stale";
    statusTone = "text-ember";
  } else if (isRunning) {
    StatusIcon = Loader2;
    statusLabel = "Running";
    statusTone = "text-navy";
  } else if (isNeverRun) {
    StatusIcon = CircleDashed;
    statusLabel = "Never run";
    statusTone = "text-ink/40";
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${isBad ? "border-ember/30 bg-ember/5" : "border-ink/5 bg-white"}`}
      role="group"
      aria-label={`${CRON_JOB_LABELS[entry.jobName] ?? entry.jobName} — ${statusLabel}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-data text-[11px] font-semibold uppercase tracking-wide text-ink/45">{entry.jobName}</p>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${statusTone}`}>
          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${isRunning ? "animate-spin" : ""}`} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-ink">{CRON_JOB_LABELS[entry.jobName] ?? entry.jobName}</p>

      <dl className="mt-3 space-y-1.5 text-xs">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-ink/45">Last run</dt>
          <dd className="font-data text-ink/75">{formatDateTime(entry.lastRun?.startedAt ?? null)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-ink/45">Last success</dt>
          <dd className="font-data text-ink/75">{formatDateTime(entry.lastSuccessAt)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-ink/45">Age of last success</dt>
          <dd className={`font-data font-semibold ${isStale ? "text-ember" : "text-ink/75"}`}>
            {formatHours(entry.lastSuccessAgeHours)}
          </dd>
        </div>
      </dl>

      {isFailed && entry.lastRun?.error && (
        <p className="mt-2 rounded-lg bg-ember/10 px-2 py-1.5 text-[11px] text-ember">{entry.lastRun.error}</p>
      )}
      {isStale && !isFailed && (
        <p className="mt-2 rounded-lg bg-ember/10 px-2 py-1.5 text-[11px] text-ember">
          Last success was {formatHours(entry.lastSuccessAgeHours)} ago — this job is expected roughly every{" "}
          {staleAfter}h.
        </p>
      )}
      {isNeverRun && <p className="mt-2 text-[11px] text-ink/45">No run has ever been recorded for this job.</p>}
    </div>
  );
}

export default function CronHealthGrid({ cron }: { cron: SerializedCronHealthEntry[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cron.map((entry) => (
        <CronCard key={entry.jobName} entry={entry} />
      ))}
    </div>
  );
}
