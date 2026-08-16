import Link from "next/link";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import MetricLabel from "@/components/employer/ui/MetricLabel";
import StatusDot from "@/components/employer/ui/StatusDot";
import {
  getPublishMode,
  verificationLabels,
} from "@/lib/employer/billing-helpers";
import type { SubscriptionPlan } from "@/lib/subscriptions";

const verificationDotColor: Record<string, "teal" | "navy" | "ember" | "muted"> = {
  APPROVED: "teal",
  PENDING: "navy",
  REJECTED: "ember",
};

type Props = {
  verifiedStatus: string;
  activeJobs: number;
  plan: SubscriptionPlan;
  variant?: "free" | "pro";
};

export default function BillingStatusStrip({
  verifiedStatus,
  activeJobs,
  plan,
  variant = "free",
}: Props) {
  const publishMode = getPublishMode(plan, verifiedStatus);
  const verificationLabel = verificationLabels[verifiedStatus] ?? verifiedStatus;
  const needsVerification = verifiedStatus !== "APPROVED";
  const isPro = variant === "pro";
  const linkClass = isPro
    ? "mt-1 inline-block text-xs font-medium text-[#9A5B12] hover:underline"
    : "mt-1 inline-block text-xs font-medium text-teal hover:underline";

  const inner = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div>
        <MetricLabel className="text-ink/40">Company verification</MetricLabel>
        <div className="mt-1.5 flex items-center gap-2">
          <StatusDot color={verificationDotColor[verifiedStatus] ?? "muted"} />
          <p className="text-sm font-semibold text-ink">{verificationLabel}</p>
        </div>
        {needsVerification && (
          <Link href="/employer/company-profile" className={linkClass}>
            {verifiedStatus === "REJECTED" ? "Fix and resubmit" : "Complete verification"}
          </Link>
        )}
      </div>

      <div>
        <MetricLabel className="text-ink/40">Active jobs</MetricLabel>
        <p className="mt-1.5 font-data text-xl font-bold tabular-nums text-ink">{activeJobs}</p>
        <Link href="/employer/jobs" className={linkClass}>
          Manage listings
        </Link>
      </div>

      <div>
        <MetricLabel className="text-ink/40">Job publishing</MetricLabel>
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
  );

  if (isPro) {
    return <div className="pro-card p-5 sm:p-6">{inner}</div>;
  }

  return <DashboardSurface className="!py-3">{inner}</DashboardSurface>;
}
