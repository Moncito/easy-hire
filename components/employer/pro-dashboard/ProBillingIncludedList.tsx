import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_COMPARISON_FEATURES } from "@/lib/billing/plan-comparison";

const SKIP = new Set(["Neomorphic Pro workspace UI"]);

export default function ProBillingIncludedList() {
  const included = PLAN_COMPARISON_FEATURES.filter(
    (feature) => feature.pro && !SKIP.has(feature.label)
  );

  return (
    <section className="pro-card p-5 sm:p-6">
      <h2 className="font-display text-xl font-black tracking-tight text-ink">What’s in Pro</h2>
      <p className="mt-1 text-sm text-ink/50">
        You’re paying for workflows, not a teal reskin. Instant publish still needs a verified company.
      </p>
      <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {included.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2 text-sm text-ink/75">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" strokeWidth={2.5} aria-hidden="true" />
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
        Compare public pricing on{" "}
        <Link href="/pricing" className="font-semibold text-[#9A5B12] hover:underline">
          the pricing page
        </Link>
        .
      </p>
    </section>
  );
}
