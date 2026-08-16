import ProBadge from "@/components/employer/pro/ProBadge";
import ProButton from "@/components/employer/pro/ProButton";
import Link from "next/link";

type Props = {
  companyVerified: boolean;
  periodEndLabel: string | null;
  canManageBilling: boolean;
  pastDue: boolean;
};

export default function ProBillingPlanCard({
  companyVerified,
  periodEndLabel,
  canManageBilling,
  pastDue,
}: Props) {
  return (
    <section className="pro-card mb-5 overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-black tracking-tight text-ink">Employer Pro</h2>
            <ProBadge />
            <span className="rounded-full bg-marigold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
              Current plan
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55">
            {companyVerified
              ? "Verified Pro — new listings go live instantly. Unlimited roles, Easy AI, CSV, and saved lists."
              : "Pro is active. Finish company verification to skip the admin publish queue — Pro never skips verification itself."}
          </p>
          {periodEndLabel && (
            <p className="mt-2 font-data text-xs text-ink/45">
              Current period through {periodEndLabel}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {canManageBilling ? (
            <form action="/api/billing/portal" method="POST">
              <ProButton type="submit" variant="primary">
                Manage billing
              </ProButton>
            </form>
          ) : (
            <p className="max-w-[16rem] text-xs leading-relaxed text-ink/50">
              Stripe portal opens once checkout has created a billing customer.
            </p>
          )}
          {!companyVerified && (
            <ProButton href="/employer/company-profile" variant="secondary">
              Verify company
            </ProButton>
          )}
        </div>
      </div>

      {pastDue && (
        <p className="mt-4 rounded-xl border border-ember/20 bg-ember/5 px-3.5 py-2.5 text-sm text-ember">
          Payment is past due.{" "}
          {canManageBilling ? (
            <>Update your card in Manage billing so Pro stays active.</>
          ) : (
            <>Contact support if you can’t reach the billing portal.</>
          )}
        </p>
      )}

      {!companyVerified && !pastDue && (
        <p className="mt-4 text-xs text-ink/45">
          Need docs?{" "}
          <Link href="/employer/company-profile#verification" className="font-semibold text-[#9A5B12] hover:underline">
            Upload verification
          </Link>
          .
        </p>
      )}
    </section>
  );
}
