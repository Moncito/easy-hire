import Link from "next/link";
import { Sparkles, FileText, Target, MessagesSquare, Send, LineChart, Lock } from "lucide-react";
import { requireEmployerPageContext } from "@/lib/employer-session";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import EasyAiChip from "@/components/employer/pro/EasyAiChip";
import ProBadge from "@/components/employer/pro/ProBadge";

// Wave 1 shortcuts from plans/EMPLOYER_PRO_DASHBOARD_PLAN.md — UI shell only.
// TODO(backend): wire each tile to its `/api/employer/ai/*` route once the
// Easy AI provider + rate limiting land (see plan doc "Easy AI roadmap").
const shortcuts = [
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

// TODO(backend): add "/employer/easy-ai" → "Easy AI" and
// "/employer/talent/lists" → "Saved lists" entries to
// getEmployerPageTitle() in lib/employer/nav.ts (mobile Topbar title).
export default async function EasyAiHubPage() {
  const { plan } = await requireEmployerPageContext();

  if (plan !== "PRO") {
    return <EasyAiUpgradeGate />;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[color:var(--neo-ink)] sm:text-3xl">
              Easy AI
            </h1>
            <ProBadge />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[color:var(--neo-muted)]">
            AI shortcuts for the moments that eat the most time in hiring. Every suggestion is a
            draft — nothing sends, rejects, or publishes without you.
          </p>
        </div>
      </div>

      <NeoSurface variant="raised" className="mb-5 flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="neo-inset-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--neo-gold)]">
            <Sparkles className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--neo-ink)]">Usage this month</p>
            {/* TODO(backend): replace with live AiUsageEvent rollup once
                lib/ai/* + Redis rate limiting ship. */}
            <p className="text-xs text-[color:var(--neo-muted)]">
              — of — assists used · usage tracking coming soon
            </p>
          </div>
        </div>
        <EasyAiChip variant="chip" label="What's new" href="/employer/easy-ai" />
      </NeoSurface>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((shortcut) => (
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

      <NeoSurface variant="inset" className="mt-5">
        <p className="text-xs leading-relaxed text-[color:var(--neo-muted)]">
          <span className="font-semibold text-[color:var(--neo-ink)]">Human-in-the-loop, always.</span>{" "}
          Easy AI never auto-rejects a candidate or sends a message on its own — every draft needs
          your review and confirmation first.
        </p>
      </NeoSurface>
    </>
  );
}
