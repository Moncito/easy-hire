import type { SubscriptionPlan } from "@/lib/subscriptions";

export { PLAN_COMPARISON_FEATURES, isStripeCheckoutEnabled } from "@/lib/billing/plan-comparison";

export function getPublishMode(
  plan: SubscriptionPlan,
  verifiedStatus: string
): { label: string; detail: string; tone: "neutral" | "positive" | "muted" } {
  if (plan === "PRO" && verifiedStatus === "APPROVED") {
    return {
      label: "Instant publish",
      detail: "Jobs go live after you submit — no admin queue.",
      tone: "positive",
    };
  }

  if (plan === "PRO" && verifiedStatus !== "APPROVED") {
    return {
      label: "Admin review",
      detail: "Complete company verification to unlock instant publish.",
      tone: "muted",
    };
  }

  return {
    label: "Admin review",
    detail: "Every job is reviewed before going live on Free.",
    tone: "neutral",
  };
}

export const verificationLabels: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Verified",
  REJECTED: "Rejected",
};

export const verificationDot: Record<string, string> = {
  PENDING: "bg-navy/50",
  APPROVED: "bg-teal",
  REJECTED: "bg-ember",
};

export function formatBillingPeriodEnd(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
