"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutGrid, LogOut, PanelLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useWorkspaceShell } from "@/components/workspaces/WorkspaceShellContext";
import { useRailTooltip } from "@/components/workspaces/useRailTooltip";
import FullScreenLoader from "@/components/ui/FullScreenLoader";
import ProBadge from "@/components/employer/pro/ProBadge";

export type WorkspaceNavItem = { href: string; label: string; icon: LucideIcon; active?: boolean };

function NavLink({ item, expanded }: { item: WorkspaceNavItem; expanded: boolean }) {
  const Icon = item.icon;
  const isActive = !!item.active;
  const { anchorProps, tooltip } = useRailTooltip(item.label, !expanded);

  return (
    <>
      <Link
        href={item.href}
        title={expanded ? undefined : item.label}
        {...anchorProps}
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
        {expanded && <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span>}
      </Link>
      {tooltip}
    </>
  );
}

/** Collapsed-rail footer item (Switch workspace / Log out). */
function RailFooterItem({
  label,
  expanded,
  icon: Icon,
  href,
  onClick,
  loadingLabel,
}: {
  label: string;
  expanded: boolean;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  /** When set on an `href` item, clicking shows a full-screen loader until the
   *  destination finishes resolving (the target route's layout runs its own
   *  auth + access checks, which can take a beat). */
  loadingLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { anchorProps, tooltip } = useRailTooltip(label, !expanded);
  const className = `group relative flex w-full items-center rounded-xl text-ink/45 transition hover:bg-ink/[0.04] hover:text-ink ${
    expanded ? "gap-3 px-3 py-2.5" : "h-10 w-10 justify-center"
  }`;
  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      {expanded && <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>}
    </>
  );

  const useLoader = Boolean(href && loadingLabel);

  return (
    <>
      {pending && loadingLabel && <FullScreenLoader label={loadingLabel} />}
      {href && !useLoader ? (
        <Link href={href} title={expanded ? undefined : label} {...anchorProps} className={className}>
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (pending) return;
            if (href) startTransition(() => router.push(href));
            else onClick?.();
          }}
          title={expanded ? undefined : label}
          {...anchorProps}
          className={className}
        >
          {inner}
        </button>
      )}
      {tooltip}
    </>
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
        <Link href="/" className="flex min-w-0 items-center gap-2.5 overflow-hidden transition-transform hover:scale-[1.02]" title="EasyHire home">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-sm">
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-mist/90" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          {expanded && (
            <span className="flex items-center gap-1.5 whitespace-nowrap font-display text-base font-black tracking-tighter text-ink">
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

      <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-3 ${expanded ? "px-3" : "items-center px-2"}`}>
        {items.map((item) => (
          <NavLink key={item.href} item={item} expanded={expanded} />
        ))}
      </nav>

      <div className={`shrink-0 border-t border-ink/[0.06] py-3 ${expanded ? "space-y-1 px-3" : "flex flex-col items-center gap-1 px-2"}`}>
        <RailFooterItem label="Switch workspace" expanded={expanded} icon={LayoutGrid} href="/hiring" loadingLabel="Switching workspace…" />
        <RailFooterItem label="Log out" expanded={expanded} icon={LogOut} onClick={() => signOut({ callbackUrl: "/" })} />
      </div>
    </aside>
  );
}
