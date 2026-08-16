import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import MetricLabel from "@/components/employer/ui/MetricLabel";

export type ContextualKpi = {
  label: string;
  value: string | number;
  context: string;
  href?: string;
  icon: LucideIcon;
  accent?: "teal" | "navy" | "ember";
};

type Props = {
  items: ContextualKpi[];
};

const accentText: Record<NonNullable<ContextualKpi["accent"]>, string> = {
  teal: "text-teal",
  navy: "text-navy",
  ember: "text-ember",
};

const accentValue: Record<NonNullable<ContextualKpi["accent"]>, string> = {
  teal: "text-ink",
  navy: "text-ink",
  ember: "text-ember",
};

/** Compact contextual KPI summaries — max 3, strip layout (not equal-weight cards). */
export default function ProContextualKpiStrip({ items }: Props) {
  const visible = items.slice(0, 3);

  return (
    <div
      className="grid grid-cols-1 divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      role="list"
      aria-label="Hiring summary"
    >
      {visible.map((item) => {
        const Icon = item.icon;
        const accent = item.accent ?? "teal";
        const inner = (
          <>
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 shrink-0 ${accentText[accent]}`} strokeWidth={2} aria-hidden="true" />
              <MetricLabel className="text-ink/45">{item.label}</MetricLabel>
            </div>
            <p className={`font-data mt-2 text-2xl font-bold tracking-tight ${accentValue[accent]}`}>
              {item.value}
            </p>
            <p className="mt-0.5 text-xs text-ink/45">{item.context}</p>
          </>
        );

        return (
          <div key={item.label} role="listitem" className="p-5">
            {item.href ? (
              <Link
                href={item.href}
                className="block transition hover:opacity-90 focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25"
              >
                {inner}
              </Link>
            ) : (
              inner
            )}
          </div>
        );
      })}
    </div>
  );
}
