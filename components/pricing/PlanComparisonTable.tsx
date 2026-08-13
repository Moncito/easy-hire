import type { ReactNode } from "react";
import { Check, Minus } from "lucide-react";
import { PLAN_COMPARISON_FEATURES } from "@/lib/billing/plan-comparison";
import type { SubscriptionPlan } from "@/lib/subscriptions";

type Props = {
  title?: string;
  currentPlan?: SubscriptionPlan | null;
  freePrice?: string;
  freePriceDetail?: string;
  proPrice?: string;
  proPriceDetail?: string;
  showRecommendedBadge?: boolean;
  footer?: ReactNode;
  className?: string;
};

function CellIcon({ included }: { included: boolean }) {
  if (included) {
    return (
      <Check
        className="mx-auto h-4 w-4 text-teal"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    );
  }

  return (
    <Minus
      className="mx-auto h-4 w-4 text-ink/20"
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

function columnHighlight(plan: SubscriptionPlan, currentPlan: SubscriptionPlan | null | undefined) {
  if (!currentPlan) {
    return plan === "PRO" ? "bg-teal/[0.03]" : "";
  }
  if (currentPlan === plan) {
    return plan === "PRO" ? "bg-teal/[0.06]" : "bg-navy/[0.03]";
  }
  return plan === "PRO" ? "bg-teal/[0.02]" : "opacity-80";
}

export default function PlanComparisonTable({
  title = "Compare EasyHire plans",
  currentPlan = null,
  freePrice = "₱0",
  freePriceDetail = "During MVP validation",
  proPrice = "Early access",
  proPriceDetail = "After validation",
  showRecommendedBadge = true,
  footer,
  className = "",
}: Props) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)] ${className}`}
    >
      <div className="border-b border-navy/[0.06] px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-navy/[0.06]">
              <th
                scope="col"
                className="w-[44%] px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-ink/40 sm:px-6"
              >
                Feature
              </th>
              <th
                scope="col"
                className={`w-[28%] px-4 py-3 text-center ${columnHighlight("FREE", currentPlan)}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink/50">
                  Free Employer
                </span>
                {currentPlan === "FREE" && (
                  <span className="mt-1 block text-[10px] font-semibold text-navy/60">
                    Current plan
                  </span>
                )}
              </th>
              <th
                scope="col"
                className={`relative w-[28%] px-4 py-3 text-center ${columnHighlight("PRO", currentPlan)}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal">
                  Employer Pro
                </span>
                {showRecommendedBadge && currentPlan !== "PRO" && (
                  <span className="mt-1 block text-[10px] font-semibold text-teal/70">
                    Recommended
                  </span>
                )}
                {currentPlan === "PRO" && (
                  <span className="mt-1 block text-[10px] font-semibold text-teal">
                    Current plan
                  </span>
                )}
              </th>
            </tr>
            {(freePrice || proPrice) && (
              <tr className="border-b border-navy/[0.06]">
                <td className="px-5 py-3 text-xs font-medium text-ink/45 sm:px-6">Price</td>
                <td className={`px-4 py-3 text-center ${columnHighlight("FREE", currentPlan)}`}>
                  <p className="font-display text-xl font-bold text-ink">{freePrice}</p>
                  {freePriceDetail && (
                    <p className="mt-0.5 text-[11px] text-ink/45">{freePriceDetail}</p>
                  )}
                </td>
                <td className={`px-4 py-3 text-center ${columnHighlight("PRO", currentPlan)}`}>
                  <p className="font-display text-xl font-bold text-ink">{proPrice}</p>
                  {proPriceDetail && (
                    <p className="mt-0.5 text-[11px] text-ink/45">{proPriceDetail}</p>
                  )}
                </td>
              </tr>
            )}
          </thead>
          <tbody>
            {PLAN_COMPARISON_FEATURES.map((feature, index) => (
              <tr
                key={feature.label}
                className={
                  index < PLAN_COMPARISON_FEATURES.length - 1
                    ? "border-b border-navy/[0.05]"
                    : ""
                }
              >
                <th
                  scope="row"
                  className="px-5 py-3 text-left font-normal text-ink/75 sm:px-6"
                >
                  {feature.label}
                  {feature.note && (
                    <span className="ml-1 text-[11px] text-ink/40">({feature.note})</span>
                  )}
                </th>
                <td className={`px-4 py-3 text-center ${columnHighlight("FREE", currentPlan)}`}>
                  <span className="sr-only">
                    {feature.free ? "Included" : "Not included"} in Free Employer
                  </span>
                  <CellIcon included={feature.free} />
                </td>
                <td className={`px-4 py-3 text-center ${columnHighlight("PRO", currentPlan)}`}>
                  <span className="sr-only">
                    {feature.pro ? "Included" : "Not included"} in Employer Pro
                  </span>
                  <CellIcon included={feature.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && (
        <div className="border-t border-navy/[0.06] px-5 py-4 sm:px-6">{footer}</div>
      )}
    </div>
  );
}
