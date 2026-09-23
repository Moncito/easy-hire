import ProfilePhotoForm from "@/components/account/ProfilePhotoForm";
import AccountSecurityPanel from "@/components/account/AccountSecurityPanel";
import AccountNotificationsPanel from "@/components/account/AccountNotificationsPanel";
import AccountDataRightsPanel from "@/components/account/AccountDataRightsPanel";
import AccountSettingsNav, { ACCOUNT_SETTINGS_SECTIONS } from "@/components/account/AccountSettingsNav";

type Role = "SEEKER" | "EMPLOYER";

type Props = {
  role: Role;
  hasPassword: boolean;
  email: string;
  avatarUrl: string | null;
};

/**
 * Composes the four account-settings sections (Profile, Security,
 * Notifications, Privacy & data) behind one in-page nav, in that fixed
 * order — Privacy & data (and its delete-account danger zone) stays last.
 * Mounted identically from app/employer/settings/page.tsx and
 * app/seeker/settings/page.tsx, each supplying their own page chrome
 * (EmployerPageHeader vs SeekerNavBandBleed) around this.
 */
export default function AccountSettingsSections({ role, hasPassword, email, avatarUrl }: Props) {
  const isEmployer = role === "EMPLOYER";
  const [profileSection, securitySection, notificationsSection, privacySection] = ACCOUNT_SETTINGS_SECTIONS;

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-10">
      <aside className="hidden lg:block">
        <AccountSettingsNav role={role} variant="desktop" />
      </aside>

      <div className="min-w-0">
        <AccountSettingsNav role={role} variant="mobile" />

        <div className="flex flex-col gap-8">
          <section id={profileSection.id} aria-labelledby={`${profileSection.id}-heading`} className="scroll-mt-28">
            <h2 id={`${profileSection.id}-heading`} className="font-display text-lg font-bold text-ink">
              {profileSection.label}
            </h2>
            <p className="mt-1 text-sm text-ink/55">
              The photo people across EasyHire see you by.
            </p>

            <div className="mt-4 rounded-2xl border border-ink/8 bg-white p-5 sm:p-6">
              <ProfilePhotoForm email={email} initialAvatarUrl={avatarUrl} />

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-ink/8 pt-4">
                <span className="text-sm font-medium text-ink/50">Email address</span>
                <span className="truncate text-sm text-ink">{email}</span>
              </div>
            </div>
          </section>

          <section id={securitySection.id} aria-labelledby={`${securitySection.id}-heading`} className="scroll-mt-28">
            <h2 id={`${securitySection.id}-heading`} className="sr-only">
              {securitySection.label}
            </h2>
            <AccountSecurityPanel role={role} hasPassword={hasPassword} />
          </section>

          <section
            id={notificationsSection.id}
            aria-labelledby={`${notificationsSection.id}-heading`}
            className="scroll-mt-28"
          >
            <h2 id={`${notificationsSection.id}-heading`} className="sr-only">
              {notificationsSection.label}
            </h2>
            <AccountNotificationsPanel role={role} />
          </section>

          <section id={privacySection.id} aria-labelledby={`${privacySection.id}-heading`} className="scroll-mt-28">
            <h2 id={`${privacySection.id}-heading`} className="font-display text-lg font-bold text-ink">
              {privacySection.label}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-ink/55">
              Your rights under the Data Privacy Act (RA 10173) — export what we hold on you, or
              permanently delete your account{isEmployer ? " and its company footprint" : ""}.
            </p>
            <div className="mt-4">
              <AccountDataRightsPanel role={role} hasPassword={hasPassword} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
