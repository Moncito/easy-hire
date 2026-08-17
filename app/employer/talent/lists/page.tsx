import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { listTalentLists } from "@/lib/employer/talent-lists";
import { listSavedSeekers } from "@/lib/employer/talent";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProBadge from "@/components/employer/pro/ProBadge";
import ProButton from "@/components/employer/pro/ProButton";
import TalentListsBoard, {
  type TalentListSummary,
  type SavedBookmark,
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
  const { company, plan, session } = await requireEmployerPageContext();

  if (plan !== "PRO") {
    return <TalentListsUpgradeGate />;
  }

  const [lists, saved] = await Promise.all([
    listTalentLists(company.id),
    listSavedSeekers(session.user.id),
  ]);

  const initialLists: TalentListSummary[] = lists.map((list) => ({
    id: list.id,
    name: list.name,
    createdAt: list.createdAt.toISOString(),
    itemCount: list._count.items,
  }));

  const initialBookmarks: SavedBookmark[] = saved.map((seeker) => ({
    id: seeker.id,
    fullName: seeker.fullName,
    headline: seeker.headline,
    location: seeker.location,
    photoUrl: seeker.photoUrl,
  }));

  return (
    <>
      <ProPageHeader
        title="Saved lists"
        description="Bookmarks from Talent, plus named shortlists for a role or hiring round."
        stats={
          <span className="inline-flex items-center gap-2">
            <ProBadge />
            <span>
              <span className="font-data font-semibold text-ink">{initialBookmarks.length}</span>{" "}
              {initialBookmarks.length === 1 ? "bookmark" : "bookmarks"}
              {" · "}
              <span className="font-data font-semibold text-ink">{initialLists.length}</span>{" "}
              {initialLists.length === 1 ? "list" : "lists"}
            </span>
          </span>
        }
        actions={
          <ProButton
            href="/employer/talent"
            variant="secondary"
            icon={<ArrowLeft className="h-4 w-4" strokeWidth={2.25} />}
          >
            Talent search
          </ProButton>
        }
      />

      <TalentListsBoard initialLists={initialLists} initialBookmarks={initialBookmarks} />
    </>
  );
}
