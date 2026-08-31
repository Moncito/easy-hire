"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  UserRoundPlus,
  BarChart3,
  LogOut,
  MessageSquare,
  Search,
  PanelLeft,
  CreditCard,
  Sparkles,
  Settings,
} from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useRailTooltip } from "@/components/workspaces/useRailTooltip";
import { useSignOut } from "@/components/ui/useSignOut";
import ProBadge from "@/components/employer/pro/ProBadge";

type NavCounts = {
  activeJobs: number;
  needsReview: number;
  unreadMessages: number;
};

const navItems = [
  { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard, badgeKey: null as keyof NavCounts | null },
  { label: "Jobs", href: "/employer/jobs", icon: Briefcase, badgeKey: "activeJobs" as const },
  { label: "Applicants", href: "/employer/applicants", icon: Users, badgeKey: "needsReview" as const },
  { label: "Messages", href: "/employer/messages", icon: MessageSquare, badgeKey: "unreadMessages" as const },
  { label: "Talent", href: "/employer/talent", icon: Search, badgeKey: null },
  { label: "Company", href: "/employer/company-profile", icon: Building2, badgeKey: null },
  { label: "Reports", href: "/employer/reports", icon: BarChart3, badgeKey: null },
  { label: "Billing", href: "/employer/billing", icon: CreditCard, badgeKey: null },
  { label: "Settings", href: "/employer/settings", icon: Settings, badgeKey: null },
];

function NavLink({
  item,
  isActive,
  expanded,
  badge,
  isPro,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  expanded: boolean;
  badge?: number;
  isPro?: boolean;
}) {
  const Icon = item.icon;
  const { anchorProps, tooltip } = useRailTooltip(
    badge ? `${item.label} (${badge})` : item.label,
    !expanded
  );

  return (
    <>
      <Link
        href={item.href}
        title={expanded ? undefined : item.label}
        {...anchorProps}
        className={`group relative flex items-center rounded-xl transition-all duration-200 ${
          expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
        } ${
          isActive
            ? isPro
              ? "bg-marigold text-ink shadow-sm shadow-marigold/25"
              : "bg-teal text-white shadow-lg shadow-teal/30"
            : isPro
              ? "text-ink/50 hover:bg-ink/[0.04] hover:text-ink"
              : "text-mist/55 hover:bg-white/8 hover:text-mist"
        }`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
            isActive ? "scale-105" : "group-hover:scale-105"
          }`}
          strokeWidth={2}
        />
        {expanded && <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>}
        {badge !== undefined && badge > 0 && (
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
              isActive
                ? isPro
                  ? "bg-ink/10 text-ink"
                  : "bg-white/20 text-white"
                : isPro
                  ? "bg-marigold text-ink"
                  : "bg-teal/20 text-teal"
            } ${expanded ? "" : "absolute -right-0.5 -top-0.5 h-4 min-w-4 text-[9px]"}`}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
      {tooltip}
    </>
  );
}

export default function Sidebar({
  navCounts,
  plan = "FREE",
  collaborativeHiringEnabled = false,
}: {
  navCounts: NavCounts;
  plan?: "FREE" | "PRO";
  collaborativeHiringEnabled?: boolean;
}) {
  const pathname = usePathname();
  const { expanded, toggleExpanded } = useEmployerShell();
  const { signOut, overlay } = useSignOut();
  const isPro = plan === "PRO";

  return (
    <aside
      className={`employer-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col transition-[width] duration-200 ease-out lg:flex ${
        expanded ? "w-52" : "w-[60px]"
      } ${
        isPro
          ? "employer-pro-sidebar border-r"
          : "bg-navy"
      }`}
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
        className={`flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-3 ${
          expanded ? "px-3" : "items-center px-2"
        }`}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/employer/dashboard" && pathname.startsWith(item.href));

          return (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive}
              expanded={expanded}
              badge={item.badgeKey ? navCounts[item.badgeKey] : undefined}
              isPro={isPro}
            />
          );
        })}
        {collaborativeHiringEnabled && (
          <NavLink
            item={{ label: "Team", href: "/employer/team", icon: UserRoundPlus, badgeKey: null }}
            isActive={pathname === "/employer/team"}
            expanded={expanded}
            isPro={isPro}
          />
        )}
      </nav>

      {isPro && (
        <div className={`shrink-0 py-2 ${expanded ? "px-3" : "flex justify-center px-2"}`}>
          <Link
            href="/employer/easy-ai"
            title={expanded ? undefined : "Easy AI"}
            className={`group relative flex items-center rounded-xl text-[var(--pro-accent-ink,#9a5b12)] transition-colors ${
              pathname.startsWith("/employer/easy-ai")
                ? "bg-marigold/20"
                : "hover:bg-marigold/10"
            } ${expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"}`}
          >
            <Sparkles className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
            {expanded && <span className="text-sm font-semibold">Easy AI</span>}
            {!expanded && (
              <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                Easy AI
              </span>
            )}
          </Link>
        </div>
      )}

      <div
        className={`shrink-0 py-3 ${isPro ? "border-t border-ink/[0.06]" : "border-t border-white/5"} ${expanded ? "px-3" : "flex justify-center px-2"}`}
      >
        <button
          type="button"
          onClick={signOut}
          title={expanded ? undefined : "Log out"}
          className={`group relative flex w-full items-center rounded-xl transition hover:bg-ink/[0.04] hover:text-ink ${
            isPro ? "text-ink/45" : "text-mist/50"
          } ${expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"}`}
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
