import { CheckCircle2 } from "lucide-react";
import ProfilePhotoForm from "@/components/account/ProfilePhotoForm";
import AccountSecurityPanel from "@/components/account/AccountSecurityPanel";
import AccountNotificationsPanel from "@/components/account/AccountNotificationsPanel";
import AccountDataRightsPanel from "@/components/account/AccountDataRightsPanel";
import AccountSettingsNav, {
  type AccountSettingsSectionId,
} from "@/components/account/AccountSettingsNav";
import Badge from "@/components/ui/Badge";
import { relativeTime } from "@/lib/time-ago";

type Role = "SEEKER" | "EMPLOYER";

type Props = {
  role: Role;
  /** Which section to render — parsed server-side from `?section=` by the page (see parseAccountSettingsSection). */
  activeSection: AccountSettingsSectionId;
  hasPassword: boolean;
  email: string;
  avatarUrl: string | null;
  /** Null renders a quiet "Not verified" state — never a scary warning. */
  emailVerifiedAt: Date | null;
  /**
   * Null means "never recorded" (accounts predating the column), not "never
   * changed" — AccountSecurityPanel is responsible for rendering that
   * honestly. Formatted to a string here, server-side, so the client panel
   * never computes relative time from `Date.now()` at render and risks a
   * hydration mismatch.
   */
  passwordChangedAt: Date | null;
  /**
   * Pre-formatted "<Month> <Year>" string for "Joined …" on the profile
   * row, or null in the (practically unreachable) case the account lookup
   * itself failed. Formatted server-side for the same hydration-mismatch
   * reason as passwordChangedLabel below.
   */
  joinedLabel: string | null;
};

/**
 * Composes the four account-settings sections (Profile, Security,
 * Notifications, Privacy & data) behind one left-hand nav — but only mounts
 * the one `activeSection` names. Desktop is two regions: a left settings
 * nav and one wide content column holding whichever section is active.
 * Below `lg` the nav collapses to a horizontal pill row above the content.
 *
 * Mounted identically from app/employer/settings/page.tsx and
 * app/seeker/settings/page.tsx, each supplying their own page chrome
 * (EmployerPageHeader vs SeekerNavBandBleed) around this, and both parsing
 * `?section=` the same way before passing `activeSection` down.
 */
export default function AccountSettingsSections({
  role,
  activeSection,
  hasPassword,
  email,
  avatarUrl,
  emailVerifiedAt,
  passwordChangedAt,
  joinedLabel,
}: Props) {
  const isEmployer = role === "EMPLOYER";
  const passwordChangedLabel = passwordChangedAt ? relativeTime(passwordChangedAt.toISOString()) : null;

  return (
    <>
      <AccountSettingsNav role={role} active={activeSection} variant="mobile" />

      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <aside className="hidden lg:block">
          <AccountSettingsNav role={role} active={activeSection} variant="desktop" />
        </aside>

        <div className="min-w-0">
          {activeSection === "profile" && (
            <section aria-labelledby="profile-heading">
              <h2 id="profile-heading" className="font-display text-xl font-bold text-ink">
                Profile
              </h2>
              <p className="mt-1 text-sm text-ink/55">The photo people across EasyHire see you by.</p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Profile photo</p>
                    <p className="mt-0.5 text-sm text-ink/55">JPG, PNG, or WebP. Up to 2MB.</p>
                  </div>
                  <ProfilePhotoForm email={email} initialAvatarUrl={avatarUrl} />
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-ink/[0.06] px-5 py-4 sm:px-6">
                  <span className="text-sm font-medium text-ink/70">Email address</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm text-ink">{email}</span>
                    {emailVerifiedAt ? (
                      <Badge tone="teal" size="sm" className="shrink-0">
                        <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                        Verified
                      </Badge>
                    ) : (
                      <span className="shrink-0 text-xs font-medium text-ink/40">Not verified</span>
                    )}
                  </span>
                </div>

                {joinedLabel && (
                  <div className="flex items-center justify-between gap-4 border-t border-ink/[0.06] px-5 py-4 sm:px-6">
                    <span className="text-sm font-medium text-ink/70">Joined</span>
                    <span className="text-sm text-ink">{joinedLabel}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeSection === "security" && (
            <section aria-labelledby="security-heading">
              <h2 id="security-heading" className="font-display text-xl font-bold text-ink">
                Security
              </h2>
              <p className="mt-1 text-sm text-ink/55">Manage your password and two-factor authentication.</p>
              <div className="mt-5">
                <AccountSecurityPanel role={role} hasPassword={hasPassword} passwordChangedLabel={passwordChangedLabel} />
              </div>
            </section>
          )}

          {activeSection === "notifications" && (
            <section aria-labelledby="notifications-heading">
              <h2 id="notifications-heading" className="font-display text-xl font-bold text-ink">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-ink/55">Choose what EasyHire emails you about.</p>
              <div className="mt-5">
                <AccountNotificationsPanel role={role} />
              </div>
            </section>
          )}

          {activeSection === "privacy" && (
            <section aria-labelledby="privacy-heading">
              <h2 id="privacy-heading" className="font-display text-xl font-bold text-ink">
                Privacy &amp; data
              </h2>
              <p className="mt-1 text-sm text-ink/55">
                Your rights under the Data Privacy Act (RA 10173) — export what we hold on you, or
                permanently delete your account{isEmployer ? " and its company footprint" : ""}.
              </p>
              <div className="mt-5">
                <AccountDataRightsPanel role={role} hasPassword={hasPassword} />
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
