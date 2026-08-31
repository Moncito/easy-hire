import { ShieldCheck } from "lucide-react";
import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { accountHasPassword } from "@/lib/account/auth-method";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import AccountDataRightsPanel from "@/components/account/AccountDataRightsPanel";

export default async function SeekerSettingsPage() {
  const { userId } = await requireSeekerPageContext();
  const hasPassword = await accountHasPassword(userId);

  return (
    <>
      <SeekerNavBandBleed section="Settings" icon={ShieldCheck} hint="Account & privacy" />

      <div className="pt-6 sm:pt-8">
        <div className="mb-6 animate-fade-in lg:mb-8">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Account settings</h1>
          <p className="mt-1.5 text-sm text-ink/50">Manage your data and account.</p>
        </div>

        <AccountDataRightsPanel role="SEEKER" hasPassword={hasPassword} />
      </div>
    </>
  );
}
