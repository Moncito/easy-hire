import { redirect } from "next/navigation";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { isCollaborativeHiringEnabled } from "@/lib/collaborative-hiring";
import { listCollaborativeTeam } from "@/lib/collaborative-hiring-team";
import { getOwnershipTransferState } from "@/lib/company-ownership-transfer";
import { getAccountSettingsContext } from "@/lib/account/settings-context";
import TeamWorkspace from "@/components/employer/team/TeamWorkspace";
import OwnershipTransferPanel from "@/components/employer/team/OwnershipTransferPanel";

export default async function EmployerTeamPage() {
  const { company, session } = await requireEmployerPageContext();
  if (!(await isCollaborativeHiringEnabled(company.id))) redirect("/employer/company-profile");
  const [team, transferState, account] = await Promise.all([
    listCollaborativeTeam(company.id, session.user.id),
    getOwnershipTransferState(session.user.id),
    getAccountSettingsContext(session.user.id),
  ]);
  return (
    <>
      <TeamWorkspace initialTeam={JSON.parse(JSON.stringify(team))} companyName={company.companyName} companyLogoUrl={company.logoUrl} />
      <div className="mt-8">
        <OwnershipTransferPanel
          initialState={JSON.parse(JSON.stringify(transferState))}
          hasPassword={account?.hasPassword ?? false}
        />
      </div>
    </>
  );
}
