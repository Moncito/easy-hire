import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { hasCollaborativePermission, requireCompanyMembership } from "@/lib/collaborative-hiring";
import { listCollaborativeTeam } from "@/lib/collaborative-hiring-team";
import TeamWorkspace from "@/components/employer/team/TeamWorkspace";

export default async function CollaboratorTeamPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/team`)}`);
  const membership = await requireCompanyMembership(companyId, session.user.id, "team:read");
  const team = await listCollaborativeTeam(companyId, session.user.id);
  return <main className="min-h-screen bg-mist px-5 py-8 sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/hiring" className="text-sm font-semibold text-teal hover:underline">← All workspaces</Link><TeamWorkspace initialTeam={JSON.parse(JSON.stringify(team))} companyName={team.company.companyName} companyLogoUrl={team.company.logoUrl} viewerRole={membership.role} canManage={hasCollaborativePermission(membership.role, "team:manage")} /></div></main>;
}
