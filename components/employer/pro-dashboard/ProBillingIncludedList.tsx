import Link from "next/link";
import { Check, ChevronDown, ListChecks } from "lucide-react";
import { PLAN_COMPARISON_FEATURES } from "@/lib/billing/plan-comparison";

const SKIP = new Set(["Neomorphic Pro workspace UI"]);

/**
 * Collapsed by default: the customer already bought Pro, so the full feature
 * list is reference material at the bottom of the billing page, not its body.
 * A native <details> keeps it server-rendered and keyboard-accessible.
 */
export default function ProBillingIncludedList() {
  const included = PLAN_COMPARISON_FEATURES.filter((feature) => feature.pro && !SKIP.has(feature.label));

  return (
    <details className="group rounded-card border border-eh-line bg-eh-surface p-5 shadow-eh-sm sm:p-6">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-control [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-eh-teal-tint text-eh-teal-ink" aria-hidden="true">
          <ListChecks className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
            What&apos;s included in Pro
          </span>
          <span className="num mt-0.5 block text-ui text-eh-muted">{included.length} features on your plan</span>
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-eh-muted transition-transform duration-150 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="mt-5 grid grid-cols-1 gap-3 border-t border-eh-line pt-5 sm:grid-cols-2">
        {included.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5 text-ui text-eh-ink-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-eh-teal-tint text-eh-teal-ink" aria-hidden="true">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span>
              {feature.label}
              {feature.note && <span className="mt-0.5 block text-small text-eh-muted">{feature.note}</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-small text-eh-muted">
        See both plans side by side on{" "}
        <Link href="/pricing" className="font-medium text-eh-marigold-ink hover:underline">
          the pricing page
        </Link>
        .
      </p>
    </details>
  );
}
