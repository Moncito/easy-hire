export type AccountSettingsRole = "SEEKER" | "EMPLOYER";

/**
 * Single source of truth for the section ids both AccountSettingsSections
 * (the anchors it renders) and this nav (the links it renders) must agree
 * on. Order here is the order sections must render in on the page — see
 * the account-settings rebuild's "Sections to build, in this order".
 */
export const ACCOUNT_SETTINGS_SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & data" },
] as const;

/**
 * Plain `<a href="#id">` anchors — no scroll-spy JS. `html { scroll-behavior:
 * smooth }` (app/globals.css) already makes these glide, and native anchor
 * navigation is keyboard-operable and focusable for free, unlike a tab
 * control that would have to unmount/hide the other three sections (bad for
 * screen-reader users who want to skim everything with Find-in-page or a
 * heading list). Each target <section> in AccountSettingsSections carries a
 * matching `scroll-mt-*` so it doesn't land under the employer sticky
 * topbar / seeker floating pill nav.
 *
 * Two variants share one component so the two DOM positions (sticky rail in
 * the left column vs. a horizontal strip inline with the content column)
 * can each pick the CSS that fits their grid slot — see
 * AccountSettingsSections for where each is mounted.
 */
export default function AccountSettingsNav({
  role,
  variant,
}: {
  role: AccountSettingsRole;
  variant: "desktop" | "mobile";
}) {
  const isEmployer = role === "EMPLOYER";

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Settings sections"
        className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden"
      >
        {ACCOUNT_SETTINGS_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold text-ink/70 transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isEmployer
                ? "border-teal/20 hover:border-teal/40 focus-visible:ring-teal"
                : "border-marigold/25 hover:border-marigold/45 focus-visible:ring-marigold"
            }`}
          >
            {section.label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Settings sections" className="sticky top-24 hidden flex-col gap-1 lg:flex">
      {ACCOUNT_SETTINGS_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`rounded-xl px-3 py-2 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isEmployer ? "focus-visible:ring-teal" : "focus-visible:ring-marigold"
          }`}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
