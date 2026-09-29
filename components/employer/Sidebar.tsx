"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeft } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useRailTooltip } from "@/components/workspaces/useRailTooltip";
import { useSignOut } from "@/components/ui/useSignOut";
import ProBadge from "@/components/employer/pro/ProBadge";
import {
  visibleEmployerNav,
  isEmployerNavActive,
  type NavCounts,
  type EmployerNavItem,
} from "@/lib/employer/nav";

/**
 * How a nav count reads. "alert" items (applicants waiting for review,
 * unread messages) are something to act on: a red pill, and only when
 * there's something there. "count" items (active jobs) are just a number:
 * plain muted text, never a coloured badge.
 */
function badgeKind(item: EmployerNavItem): "alert" | "count" | null {
  if (item.badgeKey === "needsReview" || item.badgeKey === "unreadMessages") return "alert";
  if (item.badgeKey === "activeJobs") return "count";
  return null;
}

function NavLink({
  item,
  isActive,
  expanded,
  badge,
  isPro,
}: {
  item: EmployerNavItem;
  isActive: boolean;
  expanded: boolean;
  badge?: number;
  isPro?: boolean;
}) {
  const Icon = item.icon;
  const kind = badgeKind(item);
  const showBadge = badge !== undefined && badge > 0 && kind !== null;
  const { anchorProps, tooltip } = useRailTooltip(
    badge ? `${item.label} (${badge})` : item.label,
    !expanded
  );

  // Pro: marigold tint with a 3px marigold rule on the sidebar's left edge,
  // not a solid orange fill. The rule sits in the nav's side padding (12px
  // expanded, 10px when the 40px item is centred in the 60px rail).
  const proActive = `bg-eh-marigold-tint font-semibold text-eh-ink before:absolute before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-[3px] before:bg-eh-marigold before:content-[''] ${
    expanded ? "before:-left-3" : "before:-left-[10px]"
  }`;

  return (
    <>
      <Link
        href={item.href}
        title={expanded ? undefined : item.label}
        aria-current={isActive ? "page" : undefined}
        {...anchorProps}
        className={`group relative flex items-center transition-colors duration-150 ${
          isPro ? "rounded-control" : "rounded-xl"
        } ${expanded ? "gap-3 px-3 py-2" : "h-10 w-10 justify-center"} ${
          isActive
            ? isPro
              ? proActive
              : "bg-teal text-white shadow-lg shadow-teal/30"
            : isPro
              ? "font-medium text-eh-ink-2 hover:bg-eh-surface-2 hover:text-eh-ink"
              : "text-mist/55 hover:bg-white/8 hover:text-mist"
        }`}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
        {expanded && <span className="min-w-0 flex-1 truncate text-sm">{item.label}</span>}
        {showBadge &&
          (kind === "alert" ? (
            <span
              className={`num flex items-center justify-center rounded-full bg-ember font-semibold text-white ${
                expanded ? "h-[18px] min-w-[18px] px-1 text-[11px]" : "absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[9px]"
              }`}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          ) : (
            expanded && (
              <span className={`num text-xs ${isPro ? "text-eh-muted" : "text-mist/45"}`}>{badge}</span>
            )
          ))}
      </Link>
      {tooltip}
    </>
  );
}

/**
 * Free only: how many of the plan's active job slots are in use. Counts jobs
 * live or awaiting review — the same number the Free cap enforces
 * (getActiveJobCount) — so it can't say "2 of 3" while posting is blocked.
 * Pro has no job limit, so it has no card.
 */
function PlanUsageCard({ used, limit }: { used: number; limit: number }) {
  const ratio = Math.min(1, used / limit);
  const full = used >= limit;
  return (
    <Link
      href="/employer/billing"
      className="block rounded-card border border-white/10 px-3 py-3 transition hover:border-white/20 hover:bg-white/[0.04]"
    >
      <span className="block text-sm font-semibold text-mist">Free plan</span>
      <span className="num mt-0.5 block text-xs text-mist/55">
        {used} of {limit} active job slots used
      </span>
      <span
        className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10"
        role="meter"
        aria-label="Active job slots used"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
      >
        <span
          className={`block h-full rounded-full ${full ? "bg-marigold" : "bg-teal"}`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </Link>
  );
}
export default function Sidebar({
  navCounts,
  plan = "FREE",
  collaborativeHiringEnabled = false,
  jobSlots = null,
}: {
  navCounts: NavCounts;
  plan?: "FREE" | "PRO";
  collaborativeHiringEnabled?: boolean;
  /** Free plan's job-slot usage; null on Pro, which has no job limit. */
  jobSlots?: { used: number; limit: number } | null;
}) {
  const pathname = usePathname();
  const { expanded, toggleExpanded } = useEmployerShell();
  const { signOut, overlay } = useSignOut();
  const isPro = plan === "PRO";

  return (
    <aside
      className={`employer-sidebar fixed left-0 z-40 hidden flex-col transition-[width] duration-200 ease-out lg:flex ${
        expanded ? "w-52" : "w-[60px]"
      } ${
        isPro
          ? "employer-pro-sidebar border-r"
          : "bg-navy"
      }`}
      // Offset by the impersonation banner's height (0px, i.e. today's exact
      // `top-0 h-screen`, unless ImpersonationBanner is mounted — see its
      // module doc comment). This is a `fixed` element, so unlike the main
      // shell column it doesn't automatically follow an ancestor's
      // `marginTop`; it needs its own top+height adjustment to land exactly
      // below the banner instead of being covered by it.
      style={{ top: "var(--eh-impersonation-h, 0px)", height: "calc(100vh - var(--eh-impersonation-h, 0px))" }}
    >
      <div
        className={`flex h-14 shrink-0 items-center ${
          isPro ? "border-b border-ink/5" : "border-b border-white/5"
        } ${expanded ? "justify-between px-3" : "justify-center"}`}
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 overflow-hidden transition-transform hover:scale-[1.02]"
          title="EasyHire home"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-sm">
            <div
              className={`absolute inset-0 ${isPro ? "bg-marigold" : "bg-teal"}`}
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
            />
            <div
              className="absolute inset-0 bg-mist/90"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            />
          </div>
          {expanded && (
            <span
              className={`flex items-center gap-1.5 whitespace-nowrap font-display text-base font-black tracking-tighter ${
                isPro ? "text-ink" : "text-mist"
              }`}
            >
              EasyHire
              {isPro && <ProBadge size="sm" />}
            </span>
          )}
        </Link>
        {expanded && (
          <button
            type="button"
            onClick={toggleExpanded}
            className={`rounded-lg p-1.5 transition ${
              isPro
                ? "text-ink/40 hover:bg-ink/[0.04] hover:text-ink"
                : "text-mist/40 hover:bg-white/8 hover:text-mist"
            }`}
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {!expanded && (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={toggleExpanded}
            className={`rounded-lg p-1.5 transition ${
              isPro
                ? "text-ink/40 hover:bg-ink/[0.04] hover:text-ink"
                : "text-mist/40 hover:bg-white/8 hover:text-mist"
            }`}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      <nav
        className={`flex flex-1 flex-col overflow-y-auto overflow-x-hidden py-3 ${
          expanded ? "gap-4 px-3" : "gap-2 items-center px-2"
        }`}
      >
        {visibleEmployerNav(collaborativeHiringEnabled).map((group, groupIndex) => {
          const items = (
            <div className={`flex flex-col gap-1 ${expanded ? "" : "items-center"}`}>
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isEmployerNavActive(pathname, item.href)}
                  expanded={expanded}
                  badge={item.badgeKey ? navCounts[item.badgeKey] : undefined}
                  isPro={isPro}
                />
              ))}
            </div>
          );

          if (!group.label) {
            return <div key="dashboard">{items}</div>;
          }

          return (
            <div key={group.label} role="group" aria-label={group.label}>
              {expanded ? (
                <p
                  aria-hidden="true"
                  className={`mb-1 px-3 ${
                    isPro ? "text-xs text-eh-muted" : "text-[10px] font-bold uppercase tracking-wider text-mist/35"
                  }`}
                >
                  {group.label}
                </p>
              ) : (
                groupIndex > 0 && (
                  <div
                    aria-hidden="true"
                    className={`mb-2 h-px w-8 ${isPro ? "bg-ink/10" : "bg-white/10"}`}
                  />
                )
              )}
              {items}
            </div>
          );
        })}
      </nav>

      {!isPro && expanded && jobSlots && (
        <div className="shrink-0 px-3 pb-2">
          <PlanUsageCard used={jobSlots.used} limit={jobSlots.limit} />
        </div>
      )}

      <div
        className={`shrink-0 py-3 ${isPro ? "border-t border-ink/[0.06]" : "border-t border-white/5"} ${expanded ? "px-3" : "flex justify-center px-2"}`}
      >
        <button
          type="button"
          onClick={signOut}
          title={expanded ? undefined : "Log out"}
          className={`group relative flex w-full items-center transition ${
            isPro
              ? "rounded-control text-eh-muted hover:bg-eh-surface-2 hover:text-eh-ink"
              : "rounded-xl text-mist/50 hover:bg-ink/[0.04] hover:text-ink"
          } ${expanded ? "gap-3 px-3 py-2" : "h-10 w-10 justify-center"}`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {expanded && <span className="text-sm font-medium">Log out</span>}
          {!expanded && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Log out
            </span>
          )}
        </button>
      </div>
      {overlay}
    </aside>
  );
}
