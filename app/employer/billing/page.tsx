import Link from "next/link";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { getCompanySubscription } from "@/lib/subscriptions";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";

export default async function EmployerBillingPage() {
  const { company, plan } = await requireEmployerPageContext();
  const subscription = await getCompanySubscription(company.id);
  const isPro = plan === "PRO";

  return (
    <>
      <EmployerPageHeader
        title="Billing"
        description="Manage your EasyHire employer plan and publishing privileges."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink/8 bg-white p-6 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Current plan</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">
            {isPro ? "Employer Pro" : "Free Employer"}
          </p>
          <p className="mt-2 text-sm text-ink/55">
            {isPro
              ? "Instant job publishing, Pro workspace UI, and advanced hiring tools."
              : "Admin-reviewed job publishing and full ATS during MVP validation."}
          </p>
          {subscription?.stripeSubscriptionId && (
            <p className="mt-3 font-data text-xs text-ink/40">
              Subscription ID: {subscription.stripeSubscriptionId}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-teal/20 bg-teal/5 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-teal">Employer Pro</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/70">
            <li>Instant publish after company verification</li>
            <li>MacOS-inspired Pro workspace</li>
            <li>Advanced analytics and exports (coming soon)</li>
            <li>Priority support if listings are flagged</li>
          </ul>
          {!isPro ? (
            <form action="/api/billing/checkout" method="POST" className="mt-5">
              <button
                type="submit"
                className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95"
              >
                Upgrade to Pro
              </button>
            </form>
          ) : (
            <p className="mt-5 text-sm font-semibold text-teal">You are on Employer Pro.</p>
          )}
          <Link href="/pricing" className="mt-3 inline-block text-xs font-medium text-teal hover:underline">
            Compare plans
          </Link>
        </section>
      </div>
    </>
  );
}
