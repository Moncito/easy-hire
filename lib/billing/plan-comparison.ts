import { FREE_ACTIVE_JOB_SOFT_CAP } from "@/lib/billing/entitlements";

export type PlanComparisonFeature = {
  label: string;
  free: boolean;
  pro: boolean;
  note?: string;
};

export const PLAN_COMPARISON_FEATURES: PlanComparisonFeature[] = [
  { label: "Job postings", free: true, pro: true },
  { label: "Applicant tracking", free: true, pro: true },
  { label: "Candidate messaging", free: true, pro: true },
  { label: "Admin review before publishing", free: true, pro: false },
  { label: "Instant job publishing", free: false, pro: true, note: "Requires verified company" },
  {
    label: "Active jobs at once",
    free: true,
    pro: true,
    note: `Free: up to ${FREE_ACTIVE_JOB_SOFT_CAP} live or pending review · Pro: unlimited`,
  },
  { label: "Featured job listings", free: false, pro: true },
  { label: "Advanced analytics + date-range reports", free: false, pro: true },
  { label: "Candidate CSV exports", free: false, pro: true },
  { label: "Saved talent lists / collections", free: false, pro: true },
  { label: "Easy AI — job description writer", free: false, pro: true },
  { label: "Easy AI — candidate match & rank", free: false, pro: true },
  { label: "Easy AI — interview kit generator", free: false, pro: true },
  { label: "Easy AI — outreach message drafts", free: false, pro: true },
  { label: "Easy AI — hiring insights narrative", free: false, pro: true },
  { label: "Neomorphic Pro workspace UI", free: false, pro: true },
  { label: "Priority support", free: false, pro: true },
];

export function isStripeCheckoutEnabled() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
}
