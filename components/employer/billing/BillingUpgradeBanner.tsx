import { CheckCircle2 } from "lucide-react";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";

export default function BillingUpgradeBanner() {
  return (
    <DashboardSurface className="mb-4 border-teal/20 bg-teal/[0.04] !py-3">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-ink">Welcome to Employer Pro</p>
          <p className="mt-0.5 text-sm text-ink/55">
            Your upgrade is active. Complete company verification to unlock instant job publishing.
          </p>
        </div>
      </div>
    </DashboardSurface>
  );
}
