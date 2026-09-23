import { requireEmployerPageContext } from "@/lib/employer-session";
import { getAccountSettingsContext } from "@/lib/account/settings-context";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import AccountSettingsSections from "@/components/account/AccountSettingsSections";

export default async function EmployerSettingsPage() {
  const { session } = await requireEmployerPageContext();
  const account = await getAccountSettingsContext(session.user.id);

  return (
    <>
      <EmployerPageHeader
        title="Account settings"
        description="Your profile, password, notifications, and data."
      />

      <AccountSettingsSections
        role="EMPLOYER"
        hasPassword={account?.hasPassword ?? false}
        email={account?.email ?? session.user.email ?? ""}
        avatarUrl={account?.avatarUrl ?? null}
      />
    </>
  );
}
