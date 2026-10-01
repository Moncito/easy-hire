import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, FileText, Landmark, Lock } from "lucide-react";
import ProButton from "@/components/employer/pro/ProButton";
import type { BillingUsage } from "@/lib/employer/billing-overview";

type Variant = "free" | "pro";

type Props = {
  variant: Variant;
  companyName: string;
  billingEmail: string;
  companyVerified: boolean;
  subscriptionStatus: "ACTIVE" | "CANCELLED" | "PAST_DUE" | null;
  periodEndLabel: string | null;
  /** A billing-portal customer exists, so "Manage billing" has somewhere to go. */
  canManageBilling: boolean;
  /** Free only: self-serve checkout is configured. */
  checkoutEnabled: boolean;
  usage: BillingUsage;
};

/** Surfaces share one radius per plan: Pro's --pro-radius, Free's 1rem. */
const SURFACE: Record<Variant, string> = {
  pro: "pro-card",
  free: "rounded-2xl border border-ink/10 bg-white",
};
const CARD: Record<Variant, string> = {
  pro: `${SURFACE.pro} p-5 sm:p-6`,
  free: `${SURFACE.free} p-5 sm:p-6`,
};

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
      {icon}
      {children}
    </h2>
  );
}

function StatusPill({ tone, children }: { tone: "teal" | "ember" | "ink"; children: ReactNode }) {
  const tones = {
    teal: "bg-teal/10 text-teal",
    ember: "bg-ember/10 text-ember",
    ink: "bg-ink/[0.06] text-ink/65",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function UsageTile({
  surface,
  label,
  value,
  detail,
  meter,
  locked,
}: {
  surface: string;
  label: string;
  value?: ReactNode;
  detail: string;
  /** 0–1 fill for plans with a limit. */
  meter?: { ratio: number; atLimit: boolean };
  locked?: boolean;
}) {
  return (
    <div className={`${surface} px-4 py-3.5`}>
      <p className="text-[13px] font-medium text-ink/60">{label}</p>
      {locked ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ink/45">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          Included in Pro
        </p>
      ) : (
        <p className="mt-1 font-data text-xl font-semibold text-ink">{value}</p>
      )}
      {meter && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]"
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(meter.ratio * 100)}
        >
          <div
            className={`h-full rounded-full ${meter.atLimit ? "bg-marigold" : "bg-teal"}`}
            style={{ width: `${Math.min(100, Math.round(meter.ratio * 100))}%` }}
          />
        </div>
      )}
      <p className="mt-1.5 text-xs text-ink/45">{detail}</p>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-ink/[0.06] py-2.5 first:border-t-0">
      <span className="text-sm text-ink/55">{label}</span>
      <span className="min-w-0 truncate text-right text-sm text-ink">{children}</span>
    </div>
  );
}

/**
 * The billing page body for both plans: what you're on, what you're using,
 * how you pay, and what you've been billed. Payments aren't live yet, so
 * payment method and invoices render honest empty states rather than
 * anything invented — the structure is here for when they are.
 */
export default function BillingOverview({
  variant,
  companyName,
  billingEmail,
  companyVerified,
  subscriptionStatus,
  periodEndLabel,
  canManageBilling,
  checkoutEnabled,
  usage,
}: Props) {
  const isPro = variant === "pro";
  const card = CARD[variant];
  const pastDue = isPro && subscriptionStatus === "PAST_DUE";
  const cancelled = isPro && subscriptionStatus === "CANCELLED";
  const atJobCap = !isPro && usage.activeJobs >= usage.freeActiveJobCap;

  let statusLine: string;
  if (!isPro) statusLine = "₱0 a month. No card needed.";
  else if (cancelled) statusLine = periodEndLabel ? `Cancelled. Pro stays on until ${periodEndLabel}.` : "Cancelled.";
  else if (periodEndLabel) statusLine = `Renews ${periodEndLabel}.`;
  else statusLine = "No charges yet. You'll see the price before any billing starts.";

  return (
    <div className="space-y-5">
      {/* Plan */}
      <section aria-labelledby="billing-plan-heading" className={card}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="billing-plan-heading" className="font-display text-xl font-semibold tracking-tight text-ink">
                {isPro ? "Employer Pro" : "Free"}
              </h2>
              {pastDue ? (
                <StatusPill tone="ember">Payment overdue</StatusPill>
              ) : cancelled ? (
                <StatusPill tone="ink">Cancelled</StatusPill>
              ) : (
                <StatusPill tone={isPro ? "teal" : "ink"}>{isPro ? "Active" : "Current plan"}</StatusPill>
              )}
            </div>
            <p className="mt-1.5 text-sm text-ink/55">{statusLine}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {isPro ? (
              <>
                {canManageBilling && (
                  <form action="/api/billing/portal" method="POST">
                    <ProButton type="submit" variant="primary">
                      Manage billing
                    </ProButton>
                  </form>
                )}
                <ProButton href="/pricing" variant="secondary">
                  Compare plans
                </ProButton>
              </>
            ) : checkoutEnabled ? (
              <form action="/api/billing/checkout" method="POST">
                <button
                  type="submit"
                  className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.98]"
                >
                  Upgrade to Pro
                </button>
              </form>
            ) : (
              <a
                href="#compare-plans"
                className="rounded-xl border border-ink/12 px-5 py-2.5 text-sm font-semibold text-ink/75 transition hover:bg-ink/[0.03]"
              >
                See what Pro adds
              </a>
            )}
          </div>
        </div>

        {pastDue && (
          <p className="mt-4 rounded-xl border border-ember/20 bg-ember/5 px-3.5 py-2.5 text-sm text-ember">
            Your last payment didn&apos;t go through.{" "}
            {canManageBilling ? "Update your card in Manage billing to keep Pro." : "Contact support to keep Pro."}
          </p>
        )}
        {isPro && !companyVerified && !pastDue && (
          <p className="mt-4 border-t border-ink/[0.06] pt-4 text-sm text-ink/60">
            Jobs still go through review until your company is verified.{" "}
            <Link href="/employer/company-profile#verification" className="font-semibold text-[#9A5B12] hover:underline">
              Finish verification
            </Link>
          </p>
        )}
      </section>

      {/* Usage */}
      <section aria-labelledby="billing-usage-heading">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 id="billing-usage-heading" className="text-[15px] font-semibold text-ink">
            Usage
          </h2>
          <span className="text-xs text-ink/40">AI and exports: last {usage.windowDays} days</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <UsageTile
            surface={SURFACE[variant]}
            label="Active jobs"
            value={isPro ? usage.activeJobs : `${usage.activeJobs} / ${usage.freeActiveJobCap}`}
            detail={
              isPro
                ? "Live or in review. No limit on Pro."
                : atJobCap
                  ? "At your limit. Close a job or upgrade."
                  : "Live or in review."
            }
            meter={
              isPro
                ? undefined
                : { ratio: usage.activeJobs / usage.freeActiveJobCap, atLimit: atJobCap }
            }
          />
          <UsageTile
            surface={SURFACE[variant]}
            label="Team seats"
            value={usage.teamSeats}
            detail={usage.teamSeats === 1 ? "Just you." : "Including you."}
            locked={!isPro && usage.teamSeats <= 1}
          />
          <UsageTile surface={SURFACE[variant]} label="Easy AI runs" value={usage.aiRuns} detail="Drafts, rankings, and kits." locked={!isPro} />
          <UsageTile surface={SURFACE[variant]} label="CSV exports" value={usage.csvExports} detail="Applicant exports." locked={!isPro} />
        </div>
      </section>

      {/* Payment and billing details — one card: a lone "no card on file"
          line stretched to match the details card looked unfinished. */}
      <section aria-labelledby="billing-details-heading" className={card}>
        <SectionTitle icon={<Landmark className="h-4 w-4 text-ink/45" aria-hidden="true" />}>
          <span id="billing-details-heading">Payment and billing details</span>
        </SectionTitle>
        <div className="mt-2">
          <DetailRow label="Payment method">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-ink/40" aria-hidden="true" />
              {canManageBilling ? (
                "Card on file"
              ) : (
                <span className="text-ink/45">{isPro ? "Added when paid plans open" : "Not needed on Free"}</span>
              )}
            </span>
          </DetailRow>
          <DetailRow label="Billed to">{companyName || <span className="text-ink/40">Company name not set</span>}</DetailRow>
          <DetailRow label="Billing email">{billingEmail}</DetailRow>
          <DetailRow label="TIN">
            <span className="text-ink/45">Asked for when paid plans open</span>
          </DetailRow>
        </div>
      </section>

      {/* Invoices — column headers only make sense once there are rows. */}
      <section aria-labelledby="billing-invoices-heading" className={card}>
        <SectionTitle icon={<FileText className="h-4 w-4 text-ink/45" aria-hidden="true" />}>
          <span id="billing-invoices-heading">Invoices and receipts</span>
        </SectionTitle>
        <p className="mt-2 text-sm text-ink/55">
          {isPro
            ? "No invoices yet. Invoices and official receipts will show up here after your first payment."
            : "No invoices. You haven't been billed on Free."}
        </p>
      </section>
    </div>
  );
}
