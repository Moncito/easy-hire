import type { ReactNode } from "react";
import { Clock } from "lucide-react";
import Avatar from "@/components/employer/system/Avatar";
import { cx } from "@/components/employer/system/cx";
import { waitSeverity } from "@/lib/employer/attention";

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * One candidate awaiting a decision: who, for what, when, how long they've
 * waited, and the actions. The wait follows the shared two-level rule
 * (waitSeverity): marigold from 3 days, Ember past 14 — and the text says
 * the number, so colour is never the only signal.
 *
 * Actions are passed in, so the same card serves the dashboard queue, the
 * applicants page, job detail, the review queue and Easy AI, each wiring
 * its own handlers. `variant="row"` is the compact list form.
 */
export default function CandidateReviewCard({
  name,
  photoUrl,
  role,
  appliedLabel,
  waitingDays,
  status,
  actions,
  variant = "card",
}: {
  name: string;
  photoUrl?: string | null;
  role: string;
  appliedLabel?: string;
  /** Days since applying without a decision; null when not waiting. */
  waitingDays?: number | null;
  /** Optional current-status badge. */
  status?: ReactNode;
  actions?: ReactNode;
  variant?: "card" | "row";
}) {
  const severity = waitSeverity(waitingDays);
  const waitText = waitingDays !== null && waitingDays !== undefined ? `Waiting ${plural(waitingDays, "day")}` : null;

  if (variant === "row") {
    return (
      <div className="flex items-center gap-3 py-2.5">
        <Avatar name={name} src={photoUrl} size="sm" />
        <p className="min-w-0 flex-1 truncate text-ui">
          <span className="font-semibold text-eh-ink">{name}</span>
          <span className="text-eh-muted"> · {role}</span>
        </p>
        {status}
        {waitText && (
          <span
            className={cx(
              "num shrink-0 text-xs font-medium",
              severity === "critical" ? "text-eh-danger" : severity === "attention" ? "text-eh-marigold-ink" : "text-eh-muted"
            )}
          >
            {plural(waitingDays!, "day")}
          </span>
        )}
        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      </div>
    );
  }

  return (
    <div
      className={cx(
        "grid grid-cols-[auto_1fr] items-center gap-3.5 rounded-card border p-3.5 min-[861px]:grid-cols-[auto_1fr_auto]",
        severity === "critical"
          ? "border-[color-mix(in_srgb,var(--eh-danger)_30%,var(--eh-line))] bg-eh-danger-tint"
          : severity === "attention"
            ? "border-[color-mix(in_srgb,var(--eh-marigold)_40%,var(--eh-line))] bg-eh-marigold-tint"
            : "border-eh-line bg-eh-surface"
      )}
    >
      <Avatar name={name} src={photoUrl} size="md" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-eh-ink">{name}</p>
          {status}
        </div>
        <p className="truncate text-ui text-eh-muted">
          {role}
          {appliedLabel && ` · Applied ${appliedLabel}`}
        </p>
        {waitText && (
          <p
            className={cx(
              "num mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide",
              severity === "critical" ? "text-eh-danger" : severity === "attention" ? "text-eh-marigold-ink" : "text-eh-muted"
            )}
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {waitText}
          </p>
        )}
      </div>
      {actions && (
        <div className="col-span-2 flex flex-wrap gap-1.5 min-[861px]:col-span-1 min-[861px]:justify-end">{actions}</div>
      )}
    </div>
  );
}
