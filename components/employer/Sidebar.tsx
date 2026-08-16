"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  BarChart3,
  LogOut,
  MessageSquare,
  Search,
  PanelLeft,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
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

  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      className={`group relative flex items-center rounded-xl transition-all duration-200 ${
        expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
      } ${
        isActive
          ? isPro
            ? "neo-inset-sm text-[color:var(--neo-teal)]"
            : "bg-teal text-white shadow-lg shadow-teal/30"
          : isPro
            ? "employer-sidebar-navlink-pro text-[color:var(--neo-muted)] hover:text-[color:var(--neo-ink)]"
            : "text-mist/55 hover:bg-white/8 hover:text-mist"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
          isActive ? "scale-105" : "group-hover:scale-105"
        }`}
        strokeWidth={2}
      />
      {expanded && <span className="flex-1 text-sm font-medium">{item.label}</span>}
      {badge !== undefined && badge > 0 && (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
            isActive
              ? isPro
                ? "bg-[color:var(--neo-teal)]/15 text-[color:var(--neo-teal)]"
                : "bg-white/20 text-white"
              : "bg-teal/20 text-teal"
          } ${expanded ? "" : "absolute -right-0.5 -top-0.5 h-4 min-w-4 text-[9px]"}`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {!expanded && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {item.label}
          {badge ? ` (${badge})` : ""}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({
  navCounts,
  plan = "FREE",
}: {
  navCounts: NavCounts;
  plan?: "FREE" | "PRO";
}) {
  const pathname = usePathname();
  const { expanded, toggleExpanded } = useEmployerShell();
  const isPro = plan === "PRO";

  return (
    <aside
      className={`employer-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col transition-[width] duration-200 ease-out lg:flex ${
        expanded ? "w-52" : "w-[60px]"
      } ${
        isPro
          ? "border-r border-transparent bg-[color:var(--neo-bg,#edf1f4)] shadow-[10px_0_30px_-14px_rgba(13,39,80,0.28)]"
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
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          title="EasyHire home"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-md shadow-black/20">
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div
              className="absolute inset-0 bg-mist/90"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
            />
          </div>
          {expanded && (
            <span
              className={`flex items-center gap-1.5 font-display text-base font-bold tracking-tight ${
                isPro ? "text-[color:var(--neo-ink)]" : "text-mist"
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
                ? "text-[color:var(--neo-muted)] hover:text-[color:var(--neo-ink)]"
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
                ? "text-[color:var(--neo-muted)] hover:text-[color:var(--neo-ink)]"
                : "text-mist/40 hover:bg-white/8 hover:text-mist"
            }`}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      <nav
        className={`flex flex-1 flex-col gap-1 overflow-y-auto py-3 ${
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
      </nav>

      {isPro && (
        <div className={`shrink-0 py-2 ${expanded ? "px-3" : "flex justify-center px-2"}`}>
          <Link
            href="/employer/easy-ai"
            title={expanded ? undefined : "Easy AI"}
            className={`neo-pressable group relative flex items-center rounded-xl text-[color:var(--neo-gold)] transition-colors ${
              pathname.startsWith("/employer/easy-ai")
                ? "neo-inset-sm"
                : "employer-sidebar-navlink-pro"
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
        className={`shrink-0 py-3 ${isPro ? "border-t border-[rgba(91,107,124,0.14)]" : "border-t border-white/5"} ${expanded ? "px-3" : "flex justify-center px-2"}`}
      >
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={expanded ? undefined : "Log out"}
          className={`group relative flex w-full items-center rounded-xl transition hover:bg-ember/15 hover:text-ember ${
            isPro ? "text-[color:var(--neo-muted)]" : "text-mist/50"
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
    </aside>
  );
}
