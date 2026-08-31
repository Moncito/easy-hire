import { requireEmployerPageContext } from "@/lib/employer-session";
import { accountHasPassword } from "@/lib/account/auth-method";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import AccountDataRightsPanel from "@/components/account/AccountDataRightsPanel";

export default async function EmployerSettingsPage() {
  const { session } = await requireEmployerPageContext();
  const hasPassword = await accountHasPassword(session.user.id);

  return (
    <>
      <EmployerPageHeader
        title="Account settings"
        description="Manage your data and account."
      />

      <AccountDataRightsPanel role="EMPLOYER" hasPassword={hasPassword} />
    </>
  );
}
