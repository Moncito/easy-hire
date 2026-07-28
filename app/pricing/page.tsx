import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell, { Section } from "@/components/legal/LegalPageShell";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — EasyHire",
  description: "EasyHire is free during MVP. See what's included and what's coming.",
};

const included = [
  "Unlimited job postings (admin-reviewed)",
  "Full applicant pipeline (Kanban ATS)",
  "Company profile page",
  "In-platform messaging (coming Sprint 5)",
  "Email notifications on apply and status updates",
  "Never charge job seekers — ever",
];

const comingSoon = [
  { name: "Featured job placement", desc: "Priority visibility in search results" },
  { name: "Employer Pro", desc: "Advanced analytics, talent search, and team tools" },
  { name: "AI hiring assistant", desc: "Candidate ranking and explainability — never auto-reject" },
];

export default function PricingPage() {
  return (
    <LegalPageShell
      title="Pricing"
      description="Free during MVP validation. We're building supply and trust before introducing paid features."
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

      <Section title="Coming after validation">
        <p className="text-ink/55">
          Once we have proven hire outcomes and platform liquidity, we will introduce optional
          paid features. Basic posting and messaging will remain free.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {comingSoon.map((item) => (
            <div key={item.name} className="rounded-xl border border-ink/8 bg-white p-4 shadow-xs">
              <p className="font-semibold text-ink">{item.name}</p>
              <p className="mt-1 text-xs text-ink/50">{item.desc}</p>
              <span className="mt-3 inline-block rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/40">
                Coming soon
              </span>
            </div>
          ))}
        </div>
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
