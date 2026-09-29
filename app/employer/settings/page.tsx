import { requireEmployerPageContext } from "@/lib/employer-session";
import { getAccountSettingsContext } from "@/lib/account/settings-context";
import { getBillingSettingsSummary, getTeamSettingsSummary } from "@/lib/employer/workspace-settings";
import EmployerPageHeader from "@/components/employer/ui/EmployerPageHeader";
import AccountSettingsSections from "@/components/account/AccountSettingsSections";
import {
  parseAccountSettingsSection,
  type AccountSettingsSectionId,
} from "@/components/account/AccountSettingsNav";
import WorkspaceSettingsSection, {
  type WorkspaceSettingsData,
} from "@/components/employer/settings/WorkspaceSettingsSection";

type EmployerContext = Awaited<ReturnType<typeof requireEmployerPageContext>>;

/** Loads only what the active workspace section shows; null for account sections. */
async function loadWorkspaceData(
  section: AccountSettingsSectionId,
  { company, plan, collaborativeHiringEnabled, session }: EmployerContext
): Promise<WorkspaceSettingsData | null> {
  if (section === "company") {
    return {
      section,
      company: { id: company.id, companyName: company.companyName, verifiedStatus: company.verifiedStatus },
    };
  }
  if (section === "team") {
    if (!collaborativeHiringEnabled) return { section, collaborativeHiringEnabled: false };
    return {
      section,
      collaborativeHiringEnabled: true,
      team: await getTeamSettingsSummary(company.id, session.user.id),
    };
  }
  if (section === "billing") {
    const billing = await getBillingSettingsSummary(company.id);
    return {
      section,
      plan,
      billing,
      // Formatted here, server-side, for the same hydration reason as joinedLabel.
      periodEndLabel: billing.currentPeriodEnd
        ? billing.currentPeriodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null,
    };
  }
  return null;
}

export default async function EmployerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const context = await requireEmployerPageContext();
  const { session } = context;
  const { section } = await searchParams;
  const activeSection = parseAccountSettingsSection(section, "EMPLOYER");

  const [account, workspaceData] = await Promise.all([
    getAccountSettingsContext(session.user.id),
    loadWorkspaceData(activeSection, context),
  ]);
  const joinedLabel = account
    ? new Date(account.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <EmployerPageHeader
        title="Settings"
        description="Your account, and the company workspace you run."
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
        workspaceContent={workspaceData ? <WorkspaceSettingsSection data={workspaceData} /> : null}
      />
    </>
  );
}
