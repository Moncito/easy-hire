import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getCollaboratorWorkspaceOverview, listCollaborativeTeam } from "@/lib/collaborative-hiring-team";
import CollaboratorWorkspace from "@/components/hiring/CollaboratorWorkspace";
import { getEmployerNotifications } from "@/lib/notifications";

export default async function CollaboratorTeamPage({ params }: { params: Promise<{ companyId: string }> }) {
  const session = await auth();
  const { companyId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/team`)}`);
  const [team, overview, notifications] = await Promise.all([
    listCollaborativeTeam(companyId, session.user.id),
    getCollaboratorWorkspaceOverview(companyId, session.user.id),
    getEmployerNotifications(session.user.id),
  ]);
  return <CollaboratorWorkspace company={team.company} team={JSON.parse(JSON.stringify({ members: team.members }))} overview={JSON.parse(JSON.stringify(overview))} notifications={JSON.parse(JSON.stringify(notifications.slice(0, 4)))} role={overview.membership.role} />;
}
