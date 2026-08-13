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
  { label: "Instant job publishing", free: false, pro: true },
  {
    label: "Featured job listings",
    free: false,
    pro: true,
    note: "Coming soon",
  },
  {
    label: "Advanced analytics",
    free: false,
    pro: true,
    note: "Coming soon",
  },
  {
    label: "Candidate exports",
    free: false,
    pro: true,
    note: "Coming soon",
  },
  { label: "Priority support", free: false, pro: true },
];

export function isStripeCheckoutEnabled() {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID);
}
