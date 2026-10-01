import type { ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/employer/system/Card";
import { cx } from "@/components/employer/system/cx";

export type TrendDirection = "up" | "down" | "flat";

/**
 * A change indicator. Direction is spelled out in the label and an arrow,
 * never colour alone. Up is teal; down and flat stay neutral — fewer
 * applications isn't an error.
 */
export function TrendIndicator({
  direction,
  children,
  title,
}: {
  direction: TrendDirection;
  children: ReactNode;
  /** Longer explanation on hover, e.g. the two periods compared. */
  title?: string;
}) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : ArrowRight;
  return (
    <span
      title={title}
      className={cx(
        "num inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-px text-xs font-medium",
        direction === "up" ? "bg-eh-success-tint text-eh-success" : "bg-eh-surface-2 text-eh-muted"
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * One KPI. Neutral by default; only a metric that needs action gets the
 * attention (marigold) or critical (Ember) treatment — never decoration.
 * The value uses Space Grotesk with tabular figures.
 */
export default function MetricCard({
  label,
  value,
  icon,
  trend,
  tone = "default",
  description,
  children,
  className,
}: {
  label: string;
  value: ReactNode;
  /** 16px Lucide icon. */
  icon?: ReactNode;
  trend?: ReactNode;
  tone?: "default" | "attention" | "critical";
  /** Footer line under the value. */
  description?: ReactNode;
  /** Extra visual under the value (sparkline, wait bar). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Card as="div" padded={false} tone={tone} className={cx("flex min-h-[120px] flex-col gap-2 px-5 py-4", className)}>
      <p className="flex items-center gap-1.5 text-ui text-eh-muted [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0">
        {icon}
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cx(
            "num font-heading text-metric",
            tone === "critical" ? "text-eh-danger" : tone === "attention" ? "text-eh-marigold-ink" : "text-eh-ink"
          )}
        >
          {value}
        </span>
        {trend}
      </div>
      {children}
      {description && (
        <p className="mt-auto text-small text-eh-muted [&_b]:font-medium [&_b]:text-eh-ink-2">{description}</p>
      )}
    </Card>
  );
}
