import type { Metadata } from "next";
import Link from "next/link";
import { Check, Tag } from "lucide-react";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import PlanComparisonTable from "@/components/pricing/PlanComparisonTable";
import { isStripeCheckoutEnabled } from "@/lib/billing/plan-comparison";

const description = "EasyHire is free during MVP. See what's included, and what Employer Pro adds.";

export const metadata: Metadata = {
  // No trailing "— EasyHire": the root layout's title template already
  // appends it, so hardcoding it here would double it up.
  title: "Pricing",
  description,
  openGraph: {
    title: "Pricing — EasyHire",
    description,
    type: "website",
  },
};

const included = [
  "Unlimited job postings (admin-reviewed)",
  "Full applicant pipeline (Kanban ATS)",
  "Company profile page",
  "In-platform messaging",
  "Email notifications on apply and status updates",
  "Never charge job seekers — ever",
];

const employerProFeatures = [
  { name: "Instant job publishing", desc: "Skip the admin review queue once your company is verified" },
  { name: "Featured job placement", desc: "Priority visibility in search results for 30 days" },
  { name: "Easy AI hiring assistant", desc: "JD drafts, candidate ranking, interview kits, outreach drafts — never auto-reject" },
  { name: "Advanced analytics & reports", desc: "Day-by-day trends and per-job performance breakdowns" },
  { name: "Candidate CSV exports", desc: "Export your applicant pipeline for offline review" },
  { name: "Saved talent lists", desc: "Organize candidates into named shortlists across roles" },
];

export default function PricingPage() {
  const checkoutEnabled = isStripeCheckoutEnabled();
  const proPrice = checkoutEnabled ? "Employer Pro" : "Early access";
  const proPriceDetail = checkoutEnabled ? "Monthly billing via Stripe" : "Checkout opening soon";

  return (
    <LegalPageShell
      title="Pricing"
      description="Free during MVP validation. We're building supply and trust before introducing paid features."
      navSection="Pricing"
      navIcon={Tag}
      navHint="Employer plans & fees"
    >
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-teal">MVP — Free</p>
        <p className="mt-2 font-display text-4xl font-bold text-ink">₱0</p>
        <p className="mt-1 text-sm text-ink/55">No credit card required. No posting limits during validation.</p>
        <ul className="mt-6 space-y-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-ink/75">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-xl bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal/95"
        >
          Get started free
        </Link>
      </div>

      <PlanComparisonTable
        className="!shadow-xs"
        freePrice="₱0"
        freePriceDetail="Free during MVP validation"
        proPrice={proPrice}
        proPriceDetail={proPriceDetail}
        showRecommendedBadge
        footer={
          <p className="text-xs leading-relaxed text-ink/50">
            Basic posting, messaging, and the full applicant pipeline stay free — forever. Employer
            Pro is an optional upgrade for teams hiring at volume.
          </p>
        }
      />

      <Section title="What Employer Pro adds">
        <p className="text-ink/55">
          Free covers everything you need to hire. Employer Pro layers on speed and scale for teams
          posting multiple roles at once — including Easy AI, our human-in-the-loop hiring assistant.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {employerProFeatures.map((item) => (
            <div key={item.name} className="rounded-xl border border-teal/15 bg-teal/[0.03] p-4 shadow-xs">
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="mt-1 text-xs text-ink/50">{item.desc}</p>
              <span className="mt-3 inline-block rounded-md bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                Employer Pro
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/employer/billing"
          className="mt-5 inline-block rounded-xl bg-teal px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal/95"
        >
          View Employer Pro
        </Link>
      </Section>

      <Section title="For job seekers">
        <p>
          EasyHire will never charge virtual assistants to create a profile, apply to jobs, or
          receive employer messages. All recruitment costs are borne by employers, in line with
          Philippine labour regulations.
        </p>
      </Section>
    </LegalPageShell>
  );
}
