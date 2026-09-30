import type { ReactNode } from "react";
import { cx } from "@/components/employer/system/cx";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE: Record<StatusTone, { badge: string; dot: string }> = {
  success: { badge: "bg-eh-success-tint text-eh-success", dot: "bg-eh-success" },
  warning: { badge: "bg-eh-marigold-tint text-eh-marigold-ink", dot: "bg-eh-marigold" },
  danger: { badge: "bg-eh-danger-tint text-eh-danger", dot: "bg-eh-danger" },
  info: {
    badge: "bg-[color-mix(in_srgb,var(--eh-navy)_10%,transparent)] text-eh-navy",
    dot: "bg-eh-navy",
  },
  neutral: { badge: "border border-eh-line bg-eh-surface-2 text-eh-ink-2", dot: "bg-eh-muted" },
};

/**
 * The one status badge: a compact pill with a text label (colour is never
 * the only signal). Pills are reserved for statuses, tags and filters —
 * buttons and cards are never fully rounded.
 */
export default function StatusBadge({
  tone = "neutral",
  dot = false,
  children,
  className,
}: {
  tone?: StatusTone;
  /** Leading status dot, for stage-style labels ("Interview"). */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const style = TONE[tone];
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        style.badge,
        className
      )}
    >
      {dot && <i className={cx("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Application stage → badge, one mapping for every screen. */
export const APPLICATION_STATUS_BADGE: Record<string, { tone: StatusTone; label: string }> = {
  APPLIED: { tone: "info", label: "Applied" },
  SHORTLISTED: { tone: "info", label: "Shortlisted" },
  INTERVIEW: { tone: "success", label: "Interview" },
  HIRED: { tone: "success", label: "Hired" },
  REJECTED: { tone: "danger", label: "Rejected" },
};

export function ApplicationStatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const mapping = APPLICATION_STATUS_BADGE[status] ?? { tone: "neutral" as const, label: status };
  return (
    <StatusBadge tone={mapping.tone} dot={dot}>
      {mapping.label}
    </StatusBadge>
  );
}
