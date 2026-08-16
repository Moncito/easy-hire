import { CheckCircle2 } from "lucide-react";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import ProBadge from "@/components/employer/pro/ProBadge";

/** Only ever rendered for plan === "PRO" (see app/employer/billing/page.tsx),
 * so the gold Pro accents apply unconditionally here. */
export default function BillingUpgradeBanner() {
  return (
    <DashboardSurface className="mb-4 border-[color:var(--neo-gold,#1f8073)]/25 bg-teal/[0.04] !py-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            Welcome to Employer Pro
            <ProBadge size="sm" />
          </p>
          <p className="mt-0.5 text-sm text-ink/55">
            Your upgrade is active. Complete company verification to unlock instant job publishing.
          </p>
        </div>
      </div>
    </DashboardSurface>
  );
}
