import Link from "next/link";
import {
  FileText,
  Target,
  MessagesSquare,
  Send,
  LineChart,
  Lock,
  ListChecks,
  Building2,
  TrendingUp,
} from "lucide-react";
import { requireEmployerPageContext } from "@/lib/employer-session";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import EasyAiChip from "@/components/employer/pro/EasyAiChip";
import EasyAiUsagePanel from "@/components/employer/pro/EasyAiUsagePanel";
import ProBadge from "@/components/employer/pro/ProBadge";

// Wave 1 — drafting, ranking and outreach assists wired to their
// `/api/employer/ai/*` routes from where they're actually used (job form,
// candidate detail, reports/dashboard). These tiles are quick jump-offs.
const wave1Shortcuts = [
  {
    label: "JD Writer",
    description: "Draft or rewrite a job title, description and requirements from a few notes.",
    icon: FileText,
    href: "/employer/jobs/new",
  },
  {
    label: "Match Rank + Explain",
    description: "Score applicants 0–100 with 3 plain-language reasons. Sort assist only.",
    icon: Target,
    href: "/employer/applicants",
  },
  {
    label: "Interview Kit",
    description: "Generate 8–12 interview questions from the job description and resume.",
    icon: MessagesSquare,
    href: "/employer/talent",
  },
  {
    label: "Outreach Drafts",
    description: "First message, follow-up, and rejection drafts for a candidate thread.",
    icon: Send,
    href: "/employer/messages",
  },
  {
    label: "Funnel Narrative",
    description: "A natural-language summary of this week's hiring health.",
    icon: LineChart,
    href: "/employer/reports",
  },
] as const;

// Wave 2–3 — self-serve shortcuts that live inside their existing flows.
const wave23Shortcuts = [
  {
    label: "Screening Questions",
    description: "Suggest up to 5 screening questions from your job title and description.",
    icon: ListChecks,
    href: "/employer/jobs/new",
  },
  {
    label: "Company Brand Copy",
    description: "Rewrite your public \"About\" copy and highlight chips from a few notes.",
    icon: Building2,
    href: "/employer/company-profile",
  },
  {
    label: "Job Performance Tips",
    description: "Concrete, numbers-based tips to improve a job's views and apply rate.",
    icon: TrendingUp,
    href: "/employer/jobs",
  },
] as const;

function EasyAiUpgradeGate() {
  return (
    <>
      <EmployerPageHeader
        title="Easy AI"
        description="AI-assisted hiring tools for job descriptions, applicant ranking, interviews and outreach."
      />
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink/10 bg-white/50 px-8 py-14 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy/10 text-navy">
          <Lock className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Easy AI is an Employer Pro feature</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/50">
            Upgrade to Employer Pro to unlock AI job description drafts, applicant match ranking,
            interview kits, outreach drafts and hiring insights.
          </p>
        </div>
        <Link
          href="/employer/billing"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal/20 transition-all hover:bg-teal/95 hover:shadow-lg hover:shadow-teal/25 active:scale-[0.98]"
        >
          View Employer Pro
        </Link>
      </div>
    </>
  );
}

export default async function EasyAiHubPage() {
  const { plan } = await requireEmployerPageContext();

  if (plan !== "PRO") {
    return <EasyAiUpgradeGate />;
  }

  return (
    <>
      <ProPageHeader
        title="Easy AI"
        description="AI shortcuts for the moments that eat the most time in hiring. Every suggestion is a draft — nothing sends, rejects, or publishes without you."
        actions={<ProBadge size="md" />}
      />

      <div className="pro-card mb-6 p-5 sm:p-6">
        <EasyAiUsagePanel />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-ink/60">Drafting, ranking & outreach</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wave1Shortcuts.map((shortcut) => (
            <EasyAiChip
              key={shortcut.label}
              variant="tile"
              href={shortcut.href}
              label={shortcut.label}
              description={shortcut.description}
              icon={<shortcut.icon className="h-4 w-4" strokeWidth={2.25} />}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-ink/60">Job quality & brand</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wave23Shortcuts.map((shortcut) => (
            <EasyAiChip
              key={shortcut.label}
              variant="tile"
              href={shortcut.href}
              label={shortcut.label}
              description={shortcut.description}
              icon={<shortcut.icon className="h-4 w-4" strokeWidth={2.25} />}
            />
          ))}
        </div>
      </div>

      <div className="pro-card mt-6 border-teal/15 bg-teal/[0.03] p-4">
        <p className="text-sm leading-relaxed text-ink/60">
          <span className="font-semibold text-ink">Human-in-the-loop, always.</span> Easy AI never
          auto-rejects a candidate or sends a message on its own — every draft needs your review
          first.
        </p>
      </div>
    </>
  );
}
