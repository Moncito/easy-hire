"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutGrid, LogOut, PanelLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkspaceShell } from "@/components/workspaces/WorkspaceShellContext";
import ProBadge from "@/components/employer/pro/ProBadge";

export type WorkspaceNavItem = { href: string; label: string; icon: LucideIcon; active?: boolean };

function NavLink({ item, expanded }: { item: WorkspaceNavItem; expanded: boolean }) {
  const Icon = item.icon;
  const isActive = !!item.active;

  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      className={`group relative flex items-center rounded-xl transition-all duration-200 ${
        expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
      } ${isActive ? "bg-marigold text-ink shadow-sm shadow-marigold/25" : "text-ink/50 hover:bg-ink/[0.04] hover:text-ink"}`}
    >
      <Icon
        className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${
          isActive ? "scale-105" : "group-hover:scale-105"
        }`}
        strokeWidth={2}
      />
      {expanded && <span className="flex-1 text-sm font-medium">{item.label}</span>}
      {!expanded && (
        <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {item.label}
        </span>
      )}
    </Link>
  );
}

export default function WorkspaceSidebar({ title, items }: { title: string; items: WorkspaceNavItem[] }) {
  const { expanded, toggleExpanded } = useWorkspaceShell();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-ink/8 bg-white transition-[width] duration-200 ease-out lg:flex ${
        expanded ? "w-52" : "w-[60px]"
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-ink/5 ${
          expanded ? "justify-between px-3" : "justify-center"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]" title="EasyHire home">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-sm">
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-mist/90" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          {expanded && (
            <span className="flex items-center gap-1.5 font-display text-base font-black tracking-tighter text-ink">
              EasyHire
              <ProBadge size="sm" />
            </span>
          )}
        </Link>
        {expanded && (
          <button
            type="button"
            onClick={toggleExpanded}
            className="rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/[0.04] hover:text-ink"
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
            className="rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/[0.04] hover:text-ink"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}

      {expanded && (
        <p className="px-6 pt-4 text-[10px] font-bold uppercase tracking-[.14em] text-ink/35">{title}</p>
      )}

      <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto py-3 ${expanded ? "px-3" : "items-center px-2"}`}>
        {items.map((item) => (
          <NavLink key={item.href} item={item} expanded={expanded} />
        ))}
      </nav>

      <div className={`shrink-0 border-t border-ink/[0.06] py-3 ${expanded ? "space-y-1 px-3" : "flex flex-col items-center gap-1 px-2"}`}>
        <Link
          href="/hiring"
          title={expanded ? undefined : "Switch workspace"}
          className={`group relative flex items-center rounded-xl text-ink/45 transition hover:bg-ink/[0.04] hover:text-ink ${
            expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
          }`}
        >
          <LayoutGrid className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {expanded && <span className="text-sm font-medium">Switch workspace</span>}
          {!expanded && (
            <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              Switch workspace
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          title={expanded ? undefined : "Log out"}
          className={`group relative flex w-full items-center rounded-xl text-ink/45 transition hover:bg-ink/[0.04] hover:text-ink ${
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
