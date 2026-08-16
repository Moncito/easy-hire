import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProBillingPerkStrip from "@/components/employer/pro-dashboard/ProBillingPerkStrip";
import ProBillingPlanCard from "@/components/employer/pro-dashboard/ProBillingPlanCard";
import ProBillingIncludedList from "@/components/employer/pro-dashboard/ProBillingIncludedList";
import BillingStatusStrip from "@/components/employer/billing/BillingStatusStrip";
import BillingUpgradeWelcome from "@/components/employer/billing/BillingUpgradeWelcome";
import {
  formatBillingPeriodEnd,
  getPublishMode,
  verificationLabels,
} from "@/lib/employer/billing-helpers";

type Props = {
  verifiedStatus: string;
  activeJobs: number;
  showWelcome: boolean;
  subscription: {
    status: string;
    stripeCustomerId: string | null;
    currentPeriodEnd: Date | null;
  } | null;
};

export default function ProBillingBoard({
  verifiedStatus,
  activeJobs,
  showWelcome,
  subscription,
}: Props) {
  const verified = verifiedStatus === "APPROVED";
  const publishMode = getPublishMode("PRO", verifiedStatus);
  const periodEndLabel = formatBillingPeriodEnd(subscription?.currentPeriodEnd);
  const verificationLabel = verificationLabels[verifiedStatus] ?? verifiedStatus;

  return (
    <div className="pb-6">
      <ProPageHeader
        title="Billing"
        description={
          verified
            ? "You’re on Employer Pro. Manage payment, invoices, and what the plan unlocks."
            : "You’re on Employer Pro. Verification still required before listings skip the admin queue."
        }
        stats={
          <>
            <span>
              Plan <span className="font-data font-semibold text-ink">Pro</span>
            </span>
            <span>
              {verified ? (
                <span className="font-semibold text-teal">{verificationLabel}</span>
              ) : (
                <span className="font-semibold text-ink">{verificationLabel}</span>
              )}
            </span>
            <span>
              Publishing{" "}
              <span className={`font-semibold ${publishMode.tone === "positive" ? "text-teal" : "text-ink"}`}>
                {publishMode.label}
              </span>
            </span>
            {periodEndLabel && (
              <span>
                Renews <span className="font-data font-semibold text-ink">{periodEndLabel}</span>
              </span>
            )}
          </>
        }
      />

      {showWelcome && <BillingUpgradeWelcome show />}

      <ProBillingPerkStrip companyVerified={verified} />

      <ProBillingPlanCard
        companyVerified={verified}
        periodEndLabel={periodEndLabel}
        canManageBilling={!!subscription?.stripeCustomerId}
        pastDue={subscription?.status === "PAST_DUE"}
      />

      <div className="mb-8">
        <BillingStatusStrip
          verifiedStatus={verifiedStatus}
          activeJobs={activeJobs}
          plan="PRO"
          variant="pro"
        />
      </div>

      <ProBillingIncludedList />
    </div>
  );
}
