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
} from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

const navItems = [
  { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/employer/jobs", icon: Briefcase },
  { label: "Applicants", href: "/employer/applicants", icon: Users },
  { label: "Messages", href: "/employer/messages", icon: MessageSquare },
  { label: "Talent", href: "/employer/talent", icon: Search },
  { label: "Company", href: "/employer/company-profile", icon: Building2 },
  { label: "Reports", href: "/employer/reports", icon: BarChart3, disabled: true },
];

function NavLink({
  item,
  isActive,
  expanded,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  expanded: boolean;
}) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        title={item.label}
        className={`flex items-center rounded-xl text-mist/25 ${
          expanded ? "justify-between px-3 py-2.5" : "h-10 w-10 justify-center"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {expanded && <span className="text-sm font-medium">{item.label}</span>}
        </div>
        {expanded && (
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
            Soon
          </span>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      className={`group relative flex items-center rounded-xl transition-all duration-200 ${
        expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
      } ${
        isActive
          ? "bg-teal text-white shadow-lg shadow-teal/30"
          : "text-mist/55 hover:bg-white/8 hover:text-mist"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
          isActive ? "scale-105" : "group-hover:scale-105"
        }`}
        strokeWidth={2}
      />
      {expanded && <span className="text-sm font-medium">{item.label}</span>}
      {!expanded && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { expanded, toggleExpanded } = useEmployerShell();

  return (
    <aside
      className={`employer-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col bg-navy transition-[width] duration-200 ease-out lg:flex ${
        expanded ? "w-52" : "w-[60px]"
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-white/5 ${
          expanded ? "justify-between px-3" : "justify-center"
        }`}
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
            <span className="font-display text-base font-bold tracking-tight text-mist">EasyHire</span>
          )}
        </Link>
        {expanded && (
          <button
            type="button"
            onClick={toggleExpanded}
            className="rounded-lg p-1.5 text-mist/40 transition hover:bg-white/8 hover:text-mist"
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
            className="rounded-lg p-1.5 text-mist/40 transition hover:bg-white/8 hover:text-mist"
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

          return <NavLink key={item.href} item={item} isActive={isActive} expanded={expanded} />;
        })}
      </nav>

      <div className={`shrink-0 border-t border-white/5 py-3 ${expanded ? "px-3" : "flex justify-center px-2"}`}>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={expanded ? undefined : "Log out"}
          className={`group relative flex w-full items-center rounded-xl text-mist/50 transition hover:bg-ember/15 hover:text-ember ${
            expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
          }`}
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
