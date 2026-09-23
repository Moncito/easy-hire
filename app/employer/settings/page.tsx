import { requireEmployerPageContext } from "@/lib/employer-session";
import { getAccountSettingsContext } from "@/lib/account/settings-context";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import AccountSettingsSections from "@/components/account/AccountSettingsSections";
import { parseAccountSettingsSection } from "@/components/account/AccountSettingsNav";

export default async function EmployerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const { session } = await requireEmployerPageContext();
  const account = await getAccountSettingsContext(session.user.id);
  const joinedLabel = account
    ? new Date(account.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;
  const { section } = await searchParams;
  const activeSection = parseAccountSettingsSection(section);

  return (
    <>
      <EmployerPageHeader
        title="Account settings"
        description="Your profile, password, notifications, and data."
      />

      <AccountSettingsSections
        role="EMPLOYER"
        activeSection={activeSection}
        hasPassword={account?.hasPassword ?? false}
        email={account?.email ?? session.user.email ?? ""}
        avatarUrl={account?.avatarUrl ?? null}
        emailVerifiedAt={account?.emailVerifiedAt ?? null}
        passwordChangedAt={account?.passwordChangedAt ?? null}
        joinedLabel={joinedLabel}
      />
    </>
  );
}
