"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles, Lock, LogOut, X } from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";
import {
  visibleEmployerNav,
  isEmployerNavActive,
  type NavCounts,
  type EmployerNavItem,
  type EmployerNavGroup,
} from "@/lib/employer/nav";

const EASY_AI_HREF = "/employer/easy-ai";

// Keep the current primary tabs (Home/Dashboard, Jobs, Applicants, Messages).
// Order matches lib/employer/nav.ts, so this doesn't introduce a second order
// to relearn — it's just the subset that gets bottom-bar real estate.
const PRIMARY_HREFS = [
  "/employer/dashboard",
  "/employer/jobs",
  "/employer/applicants",
  "/employer/messages",
] as const;

function primaryTabLabel(item: EmployerNavItem) {
  // Mobile has always called the dashboard tab "Home" rather than
  // "Dashboard" — that's bottom-tab convention, not drift to fix.
  return item.href === "/employer/dashboard" ? "Home" : item.label;
}

function isActive(pathname: string, href: string) {
  return isEmployerNavActive(pathname, href);
}

type Props = {
  plan?: "FREE" | "PRO";
  collaborativeHiringEnabled?: boolean;
  navCounts: NavCounts;
};

export default function EmployerMobileNav({
  plan = "FREE",
  collaborativeHiringEnabled = false,
  navCounts,
}: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut, overlay } = useSignOut();
  const isPro = plan === "PRO";

  const groups = visibleEmployerNav(collaborativeHiringEnabled);
  const allItems = groups.flatMap((group) => group.items);

  const primaryTabs = PRIMARY_HREFS.map((href) => allItems.find((item) => item.href === href)).filter(
    (item): item is EmployerNavItem => Boolean(item)
  );

  // Everything not on the bottom bar falls into the "More" sheet, grouped
  // the same way as desktop (same section labels, same relative order).
  const sheetGroups: EmployerNavGroup[] = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !(PRIMARY_HREFS as readonly string[]).includes(item.href)),
    }))
    .filter((group) => group.items.length > 0);

  const overflowActive =
    isActive(pathname, EASY_AI_HREF) ||
    sheetGroups.some((group) => group.items.some((item) => isActive(pathname, item.href)));

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="employer-drawer-backdrop fixed inset-0 z-40 bg-ink/25 backdrop-blur-xs lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {menuOpen && (
        <div
          className="employer-sheet-enter employer-mobile-sheet fixed bottom-16 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-ink/8 bg-white p-4 shadow-2xl lg:hidden"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">More</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Easy AI stays first for both plans, with its existing locked/unlocked treatment. */}
            <div className="space-y-1">
              <Link
                href={EASY_AI_HREF}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(pathname, EASY_AI_HREF)
                    ? "bg-teal/10 text-teal"
                    : isPro
                      ? "text-teal hover:bg-ink/[0.03]"
                      : "text-ink/35 hover:bg-ink/[0.03] hover:text-ink/55"
                }`}
              >
                {isPro ? (
                  <Sparkles className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Lock className="h-4 w-4" strokeWidth={2} />
                )}
                <span className="flex flex-1 items-center gap-1.5">
                  Easy AI
                  {!isPro && (
                    <span className="rounded-full bg-ink/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink/45">
                      Pro
                    </span>
                  )}
                </span>
              </Link>
            </div>

            {sheetGroups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label ?? undefined} className="space-y-1">
                {group.label && (
                  <p
                    aria-hidden="true"
                    className="px-3 text-[10px] font-bold uppercase tracking-wider text-ink/35"
                  >
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-teal/10 text-teal" : "text-ink/70 hover:bg-ink/[0.03]"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}

            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/65 transition-colors hover:bg-ink/[0.04] hover:text-ink"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Log out
            </button>
          </div>
        </div>
      )}

      <nav
        className="employer-mobile-nav fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-ink/8 bg-mist/95 backdrop-blur-md lg:hidden"
        aria-label="Employer mobile navigation"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab.href);
          const badge = tab.badgeKey ? navCounts[tab.badgeKey] : undefined;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? "text-teal" : "text-ink/45"
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Icon className={`h-5 w-5 ${active ? "scale-105" : ""}`} strokeWidth={active ? 2.25 : 2} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[9px] font-bold text-white">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              {primaryTabLabel(tab)}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
            menuOpen || overflowActive ? "text-teal" : "text-ink/45"
          }`}
          aria-expanded={menuOpen}
          aria-label="More navigation options"
        >
          <Menu className="h-5 w-5" strokeWidth={menuOpen || overflowActive ? 2.25 : 2} />
          More
        </button>
      </nav>
      {overlay}
    </>
  );
}
