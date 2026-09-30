import { Sparkles } from "lucide-react";
import { Button } from "@/components/employer/system";
import type { DashboardInsight } from "@/lib/employer/dashboard-insights";

/**
 * Easy AI suggestions: at most two rules-based facts (see
 * lib/employer/dashboard-insights.ts). Renders nothing when no rule fires —
 * an empty "all good!" card would just be noise.
 */
export default function ProInsightCard({ insights }: { insights: DashboardInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <section
      aria-label="Easy AI suggestions"
      className="grid grid-cols-[auto_1fr] gap-3.5 rounded-card border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint px-5 py-4"
    >
      <span className="grid h-8 w-8 place-items-center rounded-control bg-eh-teal text-white">
        <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <ul className="flex flex-col">
        {insights.map((insight, index) => (
          <li
            key={insight.id}
            className={`flex flex-wrap items-center gap-3 ${
              index > 0 ? "mt-2.5 border-t border-[color-mix(in_srgb,var(--eh-teal)_16%,transparent)] pt-2.5" : ""
            }`}
          >
            <p className="min-w-[240px] flex-1 text-body text-eh-teal-ink">
              <b className="font-semibold text-eh-ink">{insight.lead}</b>
              {insight.rest}
            </p>
            <Button href={insight.href} size="sm">
              {insight.actionLabel}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
