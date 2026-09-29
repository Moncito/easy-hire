import { requireEmployerPageContext } from "@/lib/employer-session";
import { getCompanySubscription } from "@/lib/billing/subscriptions";
import { isStripeCheckoutEnabled } from "@/lib/billing/plan-comparison";
import { getBillingUsage } from "@/lib/employer/billing-overview";
import { formatBillingPeriodEnd } from "@/lib/employer/billing-helpers";
import BillingPlanComparison from "@/components/employer/billing/BillingPlanComparison";
import BillingOverview from "@/components/employer/billing/BillingOverview";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import ProBillingBoard from "@/components/employer/pro-dashboard/ProBillingBoard";

export default async function EmployerBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { company, plan, session } = await requireEmployerPageContext();
  const [subscription, usage] = await Promise.all([
    getCompanySubscription(company.id),
    getBillingUsage(company.id),
  ]);
  const { upgraded } = await searchParams;

  const overview = {
    companyName: company.companyName,
    billingEmail: session.user.email ?? "",
    companyVerified: company.verifiedStatus === "APPROVED",
    subscriptionStatus: subscription?.status ?? null,
    periodEndLabel: formatBillingPeriodEnd(subscription?.currentPeriodEnd),
    canManageBilling: Boolean(subscription?.stripeCustomerId),
    usage,
  };

  if (plan === "PRO") {
    return <ProBillingBoard showWelcome={upgraded === "1"} {...overview} />;
  }

  return (
    <>
      <EmployerPageHeader
        title="Billing"
        description="Your plan, what you're using, and what Pro would add."
      />

      <BillingOverview variant="free" checkoutEnabled={isStripeCheckoutEnabled()} {...overview} />

      <section id="compare-plans" aria-label="Compare plans" className="mt-8 scroll-mt-24">
        <h2 className="mb-3 font-display text-base font-bold text-ink">Compare plans</h2>
        <BillingPlanComparison plan={plan} stripeSubscriptionId={subscription?.stripeSubscriptionId} />
      </section>
    </>
  );
}
