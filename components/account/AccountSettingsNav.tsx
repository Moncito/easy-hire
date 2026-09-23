import Link from "next/link";
import { Bell, Download, KeyRound, User } from "lucide-react";

export type AccountSettingsRole = "SEEKER" | "EMPLOYER";

/**
 * Single source of truth for the section ids both AccountSettingsSections
 * (the sections it renders) and this nav (the links it renders) must agree
 * on. Order here is the nav's display order. Icons mirror what each target
 * section is about (KeyRound for password/2FA, Bell for notifications,
 * Download for export/Danger zone) so the nav previews what you'll see.
 */
export const ACCOUNT_SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & data", icon: Download },
] as const;

export type AccountSettingsSectionId = (typeof ACCOUNT_SETTINGS_SECTIONS)[number]["id"];

const DEFAULT_SECTION: AccountSettingsSectionId = "profile";

/**
 * Turns the raw `?section=` search-param value (or its absence, or a stray
 * array from a repeated param, or an unrecognized value) into a known
 * section id. Both app/employer/settings/page.tsx and
 * app/seeker/settings/page.tsx call this — server-side, before rendering —
 * so AccountSettingsSections always receives a valid id and "profile" is
 * the one fallback both pages agree on.
 */
export function parseAccountSettingsSection(
  raw: string | string[] | undefined
): AccountSettingsSectionId {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return ACCOUNT_SETTINGS_SECTIONS.some((section) => section.id === value)
    ? (value as AccountSettingsSectionId)
    : DEFAULT_SECTION;
}

/**
 * Section switching is a `?section=` search param, not client state or an
 * in-page anchor: both settings pages read it server-side via
 * parseAccountSettingsSection above and pass the result down as `active`,
 * and AccountSettingsSections mounts only that one section — the other
 * three don't render (or fetch, or hold state) at all until you click
 * their nav item. That's what makes plain `<Link href="?section=...">`
 * correct here instead of onClick + useState: the back button moves
 * between sections, a section is bookmarkable/shareable as a URL, and both
 * pages stay server components (no "use client" needed just to run a nav).
 *
 * Because the active section is known on the server, highlighting it is a
 * plain conditional className — no scroll-spy JS, no `:target` CSS.
 * `aria-current="page"` is set the same way, so screen-reader users get the
 * active item called out too, not just a visual difference.
 *
 * Two variants share one component so the two DOM positions (rail in the
 * left column vs. a horizontal strip above the content column) can each
 * pick the markup that fits — see AccountSettingsSections for where each
 * is mounted.
 */
export default function AccountSettingsNav({
  role,
  active,
  variant,
}: {
  role: AccountSettingsRole;
  active: AccountSettingsSectionId;
  variant: "desktop" | "mobile";
}) {
  const isEmployer = role === "EMPLOYER";

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Settings sections"
        className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden"
      >
        {ACCOUNT_SETTINGS_SECTIONS.map((section) => {
          const isActive = active === section.id;
          return (
            <Link
              key={section.id}
              href={`?section=${section.id}`}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive
                  ? isEmployer
                    ? "border-teal/30 bg-teal/10 text-ink"
                    : "border-marigold/35 bg-marigold/15 text-ink"
                  : "border-ink/10 text-ink/60 hover:text-ink"
              } ${isEmployer ? "focus-visible:ring-teal" : "focus-visible:ring-marigold"}`}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="sticky top-24 hidden flex-col lg:flex">
      <p className="font-display text-lg font-bold text-ink">Settings</p>
      <p className="mt-1 text-sm leading-relaxed text-ink/55">
        Manage your account, preferences, and security settings.
      </p>

      <nav aria-label="Settings sections" className="mt-6 flex flex-col gap-1">
        {ACCOUNT_SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <Link
              key={section.id}
              href={`?section=${section.id}`}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive
                  ? isEmployer
                    ? "bg-teal/10 text-ink"
                    : "bg-marigold/15 text-ink"
                  : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
              } ${isEmployer ? "focus-visible:ring-teal" : "focus-visible:ring-marigold"}`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
