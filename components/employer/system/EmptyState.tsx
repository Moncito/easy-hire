import type { ReactNode } from "react";
import { cx } from "@/components/employer/system/cx";

/**
 * An empty state is an invitation, not a blank box: an icon, what's
 * missing, why, and the one action that fixes it. Replaces empty charts,
 * giant blank cards, and meaningless zeros.
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Inline version for inside a card (e.g. a chart with no data). */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex flex-col items-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-12",
        className
      )}
    >
      {icon && (
        <span className="grid h-10 w-10 place-items-center rounded-control bg-eh-surface-2 text-eh-muted [&>svg]:h-5 [&>svg]:w-5" aria-hidden="true">
          {icon}
        </span>
      )}
      <p className="text-body font-semibold text-eh-ink">{title}</p>
      {description && <p className="max-w-sm text-ui text-eh-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
