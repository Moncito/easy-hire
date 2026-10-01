import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/employer/system/Card";
import EmptyState from "@/components/employer/system/EmptyState";

/**
 * Title, timeframe and filter on top; the visualization; then a legend or
 * summary footer. When `empty` is set the visualization is replaced by a
 * compact EmptyState with its call to action — never a giant blank chart.
 */
export default function AnalyticsCard({
  id,
  title,
  description,
  filter,
  legend,
  footer,
  empty,
  children,
  className,
}: {
  id: string;
  title: string;
  /** Timeframe or scope, e.g. "Last 30 days". */
  description?: ReactNode;
  /** Right-hand control, e.g. a SegmentedControl. */
  filter?: ReactNode;
  /** Series key, shown under the header. */
  legend?: Array<{ label: string; tone: "ink" | "marigold" | "teal" }>;
  footer?: ReactNode;
  empty?: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode } | null;
  children: ReactNode;
  className?: string;
}) {
  const swatch = { ink: "bg-eh-ink", marigold: "bg-eh-marigold", teal: "bg-eh-teal" } as const;
  return (
    <Card padded={false} aria-labelledby={id} className={className ? `flex flex-col ${className}` : "flex flex-col"}>
      <div className="px-5 pt-4 sm:px-6">
        <CardHeader id={id} title={title} description={description} action={filter} />
        {legend && !empty && (
          <div className="mt-2 flex flex-wrap gap-4 text-small text-eh-muted">
            {legend.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-1.5">
                <i className={`h-2 w-2 rounded-[2px] ${swatch[item.tone]}`} aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="px-5 pb-4 pt-3 sm:px-6">
        {empty ? <EmptyState compact icon={empty.icon} title={empty.title} description={empty.description} action={empty.action} /> : children}
      </div>
      {footer && (
        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-eh-line px-5 py-3 text-ui text-eh-muted sm:px-6 [&_b]:font-semibold [&_b]:text-eh-ink">
          {footer}
        </div>
      )}
    </Card>
  );
}
