import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProBillingIncludedList from "@/components/employer/pro-dashboard/ProBillingIncludedList";
import BillingOverview from "@/components/employer/billing/BillingOverview";
import BillingUpgradeWelcome from "@/components/employer/billing/BillingUpgradeWelcome";
import type { BillingUsage } from "@/lib/employer/billing-overview";

type Props = {
  companyName: string;
  billingEmail: string;
  companyVerified: boolean;
  showWelcome: boolean;
  subscriptionStatus: "ACTIVE" | "CANCELLED" | "PAST_DUE" | null;
  periodEndLabel: string | null;
  canManageBilling: boolean;
  usage: BillingUsage;
};

export default function ProBillingBoard({ showWelcome, ...overview }: Props) {
  return (
    <div className="pb-6">
      <ProPageHeader title="Billing" description="Your plan, what you're using, and what you've been billed." />

      {showWelcome && <BillingUpgradeWelcome show />}

      <BillingOverview variant="pro" checkoutEnabled={false} {...overview} />

      <div className="mt-5">
        <ProBillingIncludedList />
      </div>
    </div>
  );
}
