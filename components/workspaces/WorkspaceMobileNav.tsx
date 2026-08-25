"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutGrid, LogOut, Menu, X } from "lucide-react";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import type { WorkspaceSection } from "@/components/workspaces/WorkspaceForRole";
import { getWorkspaceNavItems } from "@/components/workspaces/workspaceNavItems";

type Props = {
  companyId: string;
  role: CompanyMemberRole;
  active: WorkspaceSection;
};

/**
 * Bottom tab bar for the collaborator workspace on small screens, mirroring
 * components/employer/EmployerMobileNav.tsx's structure: a handful of primary
 * tabs plus a "More" button that opens a bottom sheet for the rest. Item data
 * comes from the shared components/workspaces/workspaceNavItems.ts module —
 * the same source the desktop sidebars use — so the two surfaces stay in sync.
 */
export default function WorkspaceMobileNav({ companyId, role, active }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = getWorkspaceNavItems(role, companyId, active);
  const primaryTabs = items.filter((item) => item.primary);
  const overflowLinks = items.filter((item) => !item.primary);
  const overflowActive = overflowLinks.some((link) => link.active);

  return (
    <>
      {menuOpen && (
        <button
          type="button"
          className="employer-drawer-backdrop fixed inset-0 z-40 cursor-pointer bg-ink/25 backdrop-blur-xs lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {menuOpen && (
        <div className="employer-sheet-enter employer-mobile-sheet fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border border-ink/8 bg-white p-4 shadow-2xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">More</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="cursor-pointer rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {overflowLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    link.active ? "bg-teal/10 text-teal" : "text-ink/70 hover:bg-ink/[0.03]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/hiring"
              onClick={() => setMenuOpen(false)}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/[0.03]"
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={2} />
              Switch workspace
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/65 transition-colors hover:bg-ink/[0.04] hover:text-ink"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Log out
            </button>
          </div>
        </div>
      )}

      <nav
        className="employer-mobile-nav fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-ink/8 bg-mist/95 backdrop-blur-md lg:hidden"
        aria-label="Workspace mobile navigation"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                tab.active ? "text-teal" : "text-ink/45"
              }`}
            >
              <Icon className={`h-5 w-5 ${tab.active ? "scale-105" : ""}`} strokeWidth={tab.active ? 2.25 : 2} />
              {tab.label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
            menuOpen || overflowActive ? "text-teal" : "text-ink/45"
          }`}
          aria-expanded={menuOpen}
          aria-label="More navigation options"
        >
          <Menu className="h-5 w-5" strokeWidth={menuOpen || overflowActive ? 2.25 : 2} />
          More
        </button>
      </nav>
    </>
  );
}
