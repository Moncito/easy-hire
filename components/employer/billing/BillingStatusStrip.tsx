import Link from "next/link";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import {
  getPublishMode,
  verificationDot,
  verificationLabels,
} from "@/lib/employer/billing-helpers";
import type { SubscriptionPlan } from "@/lib/subscriptions";

type Props = {
  verifiedStatus: string;
  activeJobs: number;
  plan: SubscriptionPlan;
};

export default function BillingStatusStrip({ verifiedStatus, activeJobs, plan }: Props) {
  const publishMode = getPublishMode(plan, verifiedStatus);
  const verificationLabel = verificationLabels[verifiedStatus] ?? verifiedStatus;
  const needsVerification = verifiedStatus !== "APPROVED";

  return (
    <DashboardSurface className="!py-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
            Company verification
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${verificationDot[verifiedStatus] ?? "bg-ink/30"}`}
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-ink">{verificationLabel}</p>
          </div>
          {needsVerification && (
            <Link
              href="/employer/company-profile"
              className="mt-1 inline-block text-xs font-medium text-teal hover:underline"
            >
              {verifiedStatus === "REJECTED" ? "Fix and resubmit" : "Complete verification"}
            </Link>
          )}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Active jobs</p>
          <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-ink">{activeJobs}</p>
          <Link
            href="/employer/jobs"
            className="mt-1 inline-block text-xs font-medium text-teal hover:underline"
          >
            Manage listings
          </Link>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
            Job publishing
          </p>
          <p
            className={`mt-1.5 text-sm font-semibold ${
              publishMode.tone === "positive"
                ? "text-teal"
                : publishMode.tone === "muted"
                  ? "text-ink/55"
                  : "text-ink"
            }`}
          >
            {publishMode.label}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/45">{publishMode.detail}</p>
        </div>
      </div>
    </DashboardSurface>
  );
}
