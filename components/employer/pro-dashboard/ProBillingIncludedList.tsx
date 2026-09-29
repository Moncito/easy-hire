import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { PLAN_COMPARISON_FEATURES } from "@/lib/billing/plan-comparison";

const SKIP = new Set(["Neomorphic Pro workspace UI"]);

/**
 * Collapsed by default: the customer already bought Pro, so the full feature
 * list is reference material at the bottom of the billing page, not its body.
 * A native <details> keeps it server-rendered and keyboard-accessible.
 */
export default function ProBillingIncludedList() {
  const included = PLAN_COMPARISON_FEATURES.filter(
    (feature) => feature.pro && !SKIP.has(feature.label)
  );

  return (
    <details className="group pro-card p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-display text-base font-bold text-ink">What&apos;s included in Pro</span>
          <span className="mt-0.5 block text-sm text-ink/50">{included.length} features on your plan</span>
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-ink/40 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="mt-5 grid grid-cols-1 gap-2 border-t border-ink/[0.06] pt-5 sm:grid-cols-2">
        {included.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2 text-sm text-ink/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={2.5} aria-hidden="true" />
            <span>
              {feature.label}
              {feature.note && (
                <span className="mt-0.5 block text-xs text-ink/40">{feature.note}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-ink/45">
        See both plans side by side on{" "}
        <Link href="/pricing" className="font-semibold text-[#9A5B12] hover:underline">
          the pricing page
        </Link>
        .
      </p>
    </details>
  );
}
