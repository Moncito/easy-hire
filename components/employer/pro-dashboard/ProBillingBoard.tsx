import type { ReactNode } from "react";
import { Briefcase, Crown, CreditCard, Download, FileText, Landmark, Sparkles, Users } from "lucide-react";
import { AttentionBanner, Button, Card, EmptyState, PageHeader, StatusBadge, cx } from "@/components/employer/system";
import ProFormSection from "@/components/employer/pro-dashboard/ProFormSection";
import ProBillingIncludedList from "@/components/employer/pro-dashboard/ProBillingIncludedList";
import BillingUpgradeWelcome from "@/components/employer/billing/BillingUpgradeWelcome";
import { TONE_CHIP, type SectionTone } from "@/components/employer/talent/tones";
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

function UsageTile({
  icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  tone: SectionTone;
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <Card as="div" padded={false} className="p-5">
      <div className="flex items-center gap-2.5">
        <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-control [&_svg]:h-[18px] [&_svg]:w-[18px]", TONE_CHIP[tone])} aria-hidden="true">
          {icon}
        </span>
        <h3 className="text-ui text-eh-muted">{label}</h3>
      </div>
      <p className="num mt-3 font-heading text-metric text-eh-ink">{value}</p>
      <p className="mt-1 text-small text-eh-muted">{detail}</p>
    </Card>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-eh-line py-3 first:border-t-0 first:pt-0">
      <dt className="text-ui text-eh-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right text-ui text-eh-ink">{children}</dd>
    </div>
  );
}

/**
 * Employer Pro billing: the plan and its state, what you're using, how you
 * pay, and what you've been billed. Payments aren't live yet, so payment
 * method and invoices show honest empty states — nothing invented.
 */
export default function ProBillingBoard({
  showWelcome,
  companyName,
  billingEmail,
  companyVerified,
  subscriptionStatus,
  periodEndLabel,
  canManageBilling,
  usage,
}: Props) {
  const pastDue = subscriptionStatus === "PAST_DUE";
  const cancelled = subscriptionStatus === "CANCELLED";
  const statusLine = cancelled
    ? periodEndLabel
      ? `Cancelled. Pro stays on until ${periodEndLabel}.`
      : "Cancelled."
    : periodEndLabel
      ? `Renews ${periodEndLabel}.`
      : "No charges yet. You'll see the price before any billing starts.";

  return (
    <div className="flex flex-col gap-6 pb-6">
      <PageHeader title="Billing" description="Your plan, what you're using, and what you've been billed." />

      {showWelcome && <BillingUpgradeWelcome show />}

      <section
        aria-labelledby="billing-plan-heading"
        className="overflow-hidden rounded-card border border-eh-line bg-eh-surface shadow-eh-md"
      >
        <div className="h-1.5 bg-eh-marigold" aria-hidden="true" />
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-card bg-eh-marigold text-[#241500] shadow-eh-sm" aria-hidden="true">
              <Crown className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="billing-plan-heading" className="font-heading text-[26px] font-bold leading-tight tracking-[-0.02em] text-eh-ink">
                  Employer Pro
                </h2>
                {pastDue ? (
                  <StatusBadge tone="danger" dot>
                    Payment overdue
                  </StatusBadge>
                ) : cancelled ? (
                  <StatusBadge tone="neutral" dot>
                    Cancelled
                  </StatusBadge>
                ) : (
                  <StatusBadge tone="success" dot>
                    Active
                  </StatusBadge>
                )}
              </div>
              <p className="mt-1 text-ui text-eh-muted">{statusLine}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {canManageBilling && (
              <form action="/api/billing/portal" method="POST">
                <Button type="submit" variant="primary" icon={<CreditCard />}>
                  Manage billing
                </Button>
              </form>
            )}
            <Button href="/pricing">Compare plans</Button>
          </div>
        </div>

        {(pastDue || !companyVerified) && (
          <div className="border-t border-eh-line px-5 py-4 sm:px-6">
            {pastDue ? (
              <AttentionBanner
                tone="critical"
                title="Your last payment didn't go through."
                description={canManageBilling ? "Update your card in Manage billing to keep Pro." : "Contact support to keep Pro."}
              />
            ) : (
              <AttentionBanner
                tone="attention"
                title="Jobs still go through review until your company is verified."
                action={
                  <Button size="sm" href="/employer/company-profile#verification">
                    Finish verification
                  </Button>
                }
              />
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="billing-usage-heading" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="billing-usage-heading" className="font-heading text-section text-eh-ink">
            Usage
          </h2>
          <span className="text-small text-eh-muted">Easy AI and exports: last {usage.windowDays} days</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UsageTile icon={<Briefcase />} tone="navy" label="Active jobs" value={usage.activeJobs} detail="Live or in review. No limit on Pro." />
          <UsageTile
            icon={<Users />}
            tone="teal"
            label="Team seats"
            value={usage.teamSeats}
            detail={usage.teamSeats === 1 ? "Just you." : "Including you."}
          />
          <UsageTile icon={<Sparkles />} tone="teal" label="Easy AI runs" value={usage.aiRuns} detail="Drafts, rankings, and kits." />
          <UsageTile icon={<Download />} tone="marigold" label="CSV exports" value={usage.csvExports} detail="Applicant exports." />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProFormSection id="billing-details" title="Payment and billing details" icon={<Landmark />} tone="navy">
          <dl>
            <DetailRow label="Payment method">
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-eh-muted" aria-hidden="true" />
                {canManageBilling ? "Card on file" : <span className="text-eh-muted">Added when paid plans open</span>}
              </span>
            </DetailRow>
            <DetailRow label="Billed to">
              {companyName || <span className="text-eh-muted">Company name not set</span>}
            </DetailRow>
            <DetailRow label="Billing email">{billingEmail}</DetailRow>
            <DetailRow label="TIN">
              <span className="text-eh-muted">Asked for when paid plans open</span>
            </DetailRow>
          </dl>
        </ProFormSection>

        <ProFormSection id="billing-invoices" title="Invoices and receipts" icon={<FileText />} tone="navy">
          <EmptyState
            compact
            icon={<FileText />}
            title="No invoices yet"
            description="Invoices and official receipts will show up here after your first payment."
            className="rounded-control border border-dashed border-eh-line bg-eh-surface-2"
          />
        </ProFormSection>
      </div>

      <ProBillingIncludedList />
    </div>
  );
}
