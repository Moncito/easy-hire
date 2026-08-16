import Link from "next/link";
import { Bookmark, FolderPlus, Lock, ArrowRight } from "lucide-react";
import { requireEmployerPageContext } from "@/lib/employer-session";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import NeoButton from "@/components/employer/pro/NeoButton";
import ProBadge from "@/components/employer/pro/ProBadge";

function TalentListsUpgradeGate() {
  return (
    <>
      <EmployerPageHeader
        title="Saved lists"
        description="Organize candidates into named shortlists you can revisit and share."
      />
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink/10 bg-white/50 px-8 py-14 text-center">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy/10 text-navy">
          <Lock className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Saved lists are an Employer Pro feature</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/50">
            Free plans can bookmark candidates one at a time from Talent search. Upgrade to Pro to
            group them into named, shareable lists.
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

// TODO(backend): this page is a UI shell. Once `SavedTalentList` (+ items)
// exists in prisma/schema.prisma and an `/api/employer/talent-lists` route
// is available (see plans/EMPLOYER_PRO_DASHBOARD_PLAN.md → "Schema / data"),
// replace the static tiles below with real list data + create/rename/delete.
export default async function TalentListsPage() {
  const { plan } = await requireEmployerPageContext();

  if (plan !== "PRO") {
    return <TalentListsUpgradeGate />;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[color:var(--neo-ink)] sm:text-3xl">
              Saved lists
            </h1>
            <ProBadge />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[color:var(--neo-muted)]">
            Group candidates from Talent search into named shortlists for a role or a hiring round.
          </p>
        </div>
        <NeoButton variant="primary" disabled icon={<FolderPlus className="h-4 w-4" strokeWidth={2.5} />}>
          New list
        </NeoButton>
      </div>

      <NeoSurface variant="raised" pressable className="mb-4">
        <Link href="/employer/talent" className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="neo-inset-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--neo-teal)]">
              <Bookmark className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-sm font-bold text-[color:var(--neo-ink)]">All saved candidates</p>
              <p className="text-xs text-[color:var(--neo-muted)]">
                Every candidate you&apos;ve bookmarked — open Talent search and toggle &ldquo;Saved&rdquo;.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--neo-muted)]" />
        </Link>
      </NeoSurface>

      <NeoSurface variant="inset" className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="neo-raised-sm flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--neo-gold)]">
          <FolderPlus className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h3 className="font-display text-base font-bold text-[color:var(--neo-ink)]">
            Named lists are coming soon
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-[color:var(--neo-muted)]">
            Create shortlists like &ldquo;Q1 support hires&rdquo; or &ldquo;Bilingual VAs&rdquo; and add
            candidates straight from their profile.
          </p>
        </div>
      </NeoSurface>
    </>
  );
}
