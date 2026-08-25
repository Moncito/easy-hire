import { redirect } from "next/navigation";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { isCollaborativeHiringEnabled } from "@/lib/collaborative-hiring";
import { listCollaborativeTeam } from "@/lib/collaborative-hiring-team";
import TeamWorkspace from "@/components/employer/team/TeamWorkspace";

export default async function EmployerTeamPage() {
  const { company, session } = await requireEmployerPageContext();
  if (!(await isCollaborativeHiringEnabled(company.id))) redirect("/employer/company-profile");
  const team = await listCollaborativeTeam(company.id, session.user.id);
  return <TeamWorkspace initialTeam={JSON.parse(JSON.stringify(team))} companyName={company.companyName} companyLogoUrl={company.logoUrl} />;
}
