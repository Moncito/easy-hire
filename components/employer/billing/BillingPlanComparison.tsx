import Link from "next/link";
import PlanComparisonTable from "@/components/pricing/PlanComparisonTable";
import { isStripeCheckoutEnabled } from "@/lib/billing/plan-comparison";
import type { SubscriptionPlan } from "@/lib/subscriptions";

type Props = {
  plan: SubscriptionPlan;
  stripeSubscriptionId?: string | null;
};

export default function BillingPlanComparison({ plan, stripeSubscriptionId }: Props) {
  const isPro = plan === "PRO";
  const checkoutEnabled = isStripeCheckoutEnabled();

  const proPrice = checkoutEnabled ? "Pro" : "Early access";
  const proPriceDetail = checkoutEnabled
    ? "Monthly billing via Stripe"
    : "Checkout when Stripe is enabled";

  return (
    <PlanComparisonTable
      currentPlan={plan}
      freePrice="₱0"
      freePriceDetail="No card required during MVP"
      proPrice={proPrice}
      proPriceDetail={proPriceDetail}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="sm:pr-2">
              {!isPro ? (
                <span className="inline-flex w-full items-center justify-center rounded-xl border border-navy/10 bg-navy/[0.03] px-5 py-2.5 text-sm font-semibold text-ink/70">
                  Current plan
                </span>
              ) : (
                <p className="text-center text-xs text-ink/55 sm:text-left">
                  Included with every employer account
                </p>
              )}
            </div>
            <div className="sm:pl-2">
              {isPro ? (
                <span className="inline-flex w-full items-center justify-center rounded-full bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm shadow-marigold/20">
                  Current plan
                </span>
              ) : checkoutEnabled ? (
                <form action="/api/billing/checkout" method="POST">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal/20 transition-all hover:bg-teal/95 hover:shadow-lg hover:shadow-teal/25 active:scale-[0.98]"
                  >
                    Upgrade to Pro
                  </button>
                </form>
              ) : (
                <p className="rounded-xl border border-ink/8 bg-white/80 px-4 py-3 text-center text-sm text-ink/55">
                  Contact support to enable Employer Pro checkout.
                </p>
              )}
            </div>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            {isPro && stripeSubscriptionId && (
              <>
                <p className="mb-2 font-data text-[11px] text-ink/35">
                  Subscription {stripeSubscriptionId}
                </p>
                <form action="/api/billing/portal" method="POST" className="mb-2 sm:inline-block">
                  <button
                    type="submit"
                    className="w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink/75 transition-colors hover:border-ink/20 hover:bg-ink/[0.02] sm:w-auto"
                  >
                    Manage billing
                  </button>
                </form>
                <br className="hidden sm:block" />
              </>
            )}
            <Link href="/pricing" className="text-xs font-medium text-ink/55 hover:text-ink hover:underline">
              View public pricing details
            </Link>
          </div>
        </div>
      }
    />
  );
}
