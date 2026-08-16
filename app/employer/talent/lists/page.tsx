import Link from "next/link";
import { Lock } from "lucide-react";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { listTalentLists } from "@/lib/employer/talent-lists";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import ProBadge from "@/components/employer/pro/ProBadge";
import TalentListsBoard, {
  type TalentListSummary,
} from "@/components/employer/talent/TalentListsBoard";

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

export default async function TalentListsPage() {
  const { company, plan } = await requireEmployerPageContext();

  if (plan !== "PRO") {
    return <TalentListsUpgradeGate />;
  }

  const lists = await listTalentLists(company.id);
  const initialLists: TalentListSummary[] = lists.map((list) => ({
    id: list.id,
    name: list.name,
    createdAt: list.createdAt.toISOString(),
    itemCount: list._count.items,
  }));

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
      </div>

      <TalentListsBoard initialLists={initialLists} />
    </>
  );
}
