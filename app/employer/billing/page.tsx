import { requireEmployerPageContext } from "@/lib/employer-session";
import { getCompanySubscription } from "@/lib/subscriptions";
import BillingPlanComparison from "@/components/employer/billing/BillingPlanComparison";
import BillingStatusStrip from "@/components/employer/billing/BillingStatusStrip";
import BillingUpgradeBanner from "@/components/employer/billing/BillingUpgradeBanner";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";

export default async function EmployerBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { company, plan, navCounts } = await requireEmployerPageContext();
  const subscription = await getCompanySubscription(company.id);
  const { upgraded } = await searchParams;
  const showUpgradeBanner = upgraded === "1" && plan === "PRO";

  return (
    <>
      <EmployerPageHeader
        title="Billing"
        description="Compare plans, see your publishing privileges, and manage Employer Pro."
      />

      {showUpgradeBanner && <BillingUpgradeBanner />}

      <div className="space-y-4">
        <BillingStatusStrip
          verifiedStatus={company.verifiedStatus}
          activeJobs={navCounts.activeJobs}
          plan={plan}
        />
        <BillingPlanComparison
          plan={plan}
          stripeSubscriptionId={subscription?.stripeSubscriptionId}
        />
      </div>
    </>
  );
}
