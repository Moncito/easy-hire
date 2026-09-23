import { ShieldCheck } from "lucide-react";
import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { getAccountSettingsContext } from "@/lib/account/settings-context";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import AccountSettingsSections from "@/components/account/AccountSettingsSections";

export default async function SeekerSettingsPage() {
  const { userId, session } = await requireSeekerPageContext();
  const account = await getAccountSettingsContext(userId);

  return (
    <>
      <SeekerNavBandBleed section="Settings" icon={ShieldCheck} hint="Account & privacy" />

      <div className="pt-6 sm:pt-8">
        <div className="mb-6 animate-fade-in lg:mb-8">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Account settings</h1>
          <p className="mt-1.5 text-sm text-ink/50">Your profile, password, notifications, and data.</p>
        </div>

        <AccountSettingsSections
          role="SEEKER"
          hasPassword={account?.hasPassword ?? false}
          email={account?.email ?? session.user.email ?? ""}
          avatarUrl={account?.avatarUrl ?? null}
          emailVerifiedAt={account?.emailVerifiedAt ?? null}
          passwordChangedAt={account?.passwordChangedAt ?? null}
        />
      </div>
    </>
  );
}
