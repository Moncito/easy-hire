"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, ChevronDown, Layers, LogOut, Users, Briefcase, ShieldCheck } from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";

// The unified moderation queues (docs/ADMIN-CONSOLE-PLAN.md §3/§4.2). The
// old per-kind links this sidebar used to carry are gone: /admin/jobs,
// /admin/seekers/verifications and /admin/reviews now redirect straight
// here, so listing them separately would have been two links to one screen.
//
// /admin/companies is the exception and keeps its own entry below — the
// verification queue moved out of it, but its collaborative-hiring access
// tool did not move anywhere, so that path still leads somewhere distinct.
const queueItems = [
  { label: "Companies", href: "/admin/queues/companies" },
  { label: "Seekers", href: "/admin/queues/seekers" },
  { label: "Jobs", href: "/admin/queues/jobs" },
  { label: "Reviews", href: "/admin/queues/reviews" },
];

/**
 * Deliberately plain primitives, not `ResolvedAdminAccess` — this file must
 * not import `/lib` (a client component would be pulling in server-only code
 * paths, and `ResolvedAdminAccess.permissions` is a `Set`, which doesn't
 * survive a Server -> Client Component prop boundary intact). The admin
 * layout converts the real resolved access into this shape once, server-side
 * (see app/admin/layout.tsx), and this component only ever reads from it.
 *
 * IMPORTANT: this is ergonomics, not the enforcement layer. Every page and
 * API route behind these links already gates itself server-side
 * (`requireAdminPagePermission` / the route's own permission check per
 * docs/ADMIN-CONSOLE-PLAN.md §8.1) — hiding a link here only stops a viewer
 * from being shown a door that would bounce them to `/admin/forbidden`
 * anyway. Getting this wrong makes the sidebar confusing, not insecure.
 */
export type AdminSidebarAccess = {
  level: string;
  permissions: string[];
};

export type AdminSidebarProps = {
  access: AdminSidebarAccess;
};

export default function AdminSidebar({ access }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut, overlay } = useSignOut();
  const queuesActive = pathname.startsWith("/admin/queues");
  const [queuesOpen, setQueuesOpen] = useState(true);

  const can = (permission: string) => access.permissions.includes(permission);
  const canDecideQueues = can("queue.decide");
  const canReadUsers = can("user.read");
  const canManageTeam = can("team.manage");

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-ink/10 bg-white">
      <div className="shrink-0 px-4 py-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-navy" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-ink">EasyHire</span>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-navy/60">Admin</span>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4">
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            pathname === "/admin/dashboard" ? "bg-navy/8 text-navy" : "text-ink/65 hover:bg-ink/4 hover:text-ink"
          }`}
        >
          <LayoutDashboard className="h-4.5 w-4.5" strokeWidth={2} />
          Dashboard
        </Link>

        {canDecideQueues && (
          <div>
            <button
              type="button"
              onClick={() => setQueuesOpen((v) => !v)}
              aria-expanded={queuesOpen}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                queuesActive ? "bg-navy/8 text-navy" : "text-ink/65 hover:bg-ink/4 hover:text-ink"
              }`}
            >
              <Layers className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-left">Queues</span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-ink/40 transition-transform ${queuesOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {queuesOpen && (
              <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-ink/10 pl-3">
                <Link
                  href="/admin/queues"
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    pathname === "/admin/queues" ? "bg-navy/8 text-navy" : "text-ink/55 hover:bg-ink/4 hover:text-ink"
                  }`}
                >
                  Overview
                </Link>
                {queueItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                        isActive ? "bg-navy/8 text-navy" : "text-ink/55 hover:bg-ink/4 hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {canDecideQueues && (
          <Link
            href="/admin/companies"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              pathname === "/admin/companies" ? "bg-navy/8 text-navy" : "text-ink/65 hover:bg-ink/4 hover:text-ink"
            }`}
          >
            <Building2 className="h-4.5 w-4.5" strokeWidth={2} />
            Company access
          </Link>
        )}

        {/* Directory group (docs/ADMIN-CONSOLE-PLAN.md §3, Phase 2): all
            users/jobs, any role/status, distinct from the moderation queues
            above. No standalone "Companies" directory link yet — reach a
            company via a user's 360 record, the job directory, or ⌘K. */}
        {(canReadUsers || canDecideQueues) && (
          <p className="mt-3 px-3 text-[10px] font-bold uppercase tracking-wider text-ink/35">Directory</p>
        )}
        {canReadUsers && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              pathname === "/admin/users" || pathname.startsWith("/admin/users/")
                ? "bg-navy/8 text-navy"
                : "text-ink/65 hover:bg-ink/4 hover:text-ink"
            }`}
          >
            <Users className="h-4.5 w-4.5" strokeWidth={2} />
            Users
          </Link>
        )}
        {canDecideQueues && (
          <Link
            href="/admin/jobs/directory"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              pathname === "/admin/jobs/directory" ? "bg-navy/8 text-navy" : "text-ink/65 hover:bg-ink/4 hover:text-ink"
            }`}
          >
            <Briefcase className="h-4.5 w-4.5" strokeWidth={2} />
            Jobs
          </Link>
        )}

        {canManageTeam && (
          <>
            <p className="mt-3 px-3 text-[10px] font-bold uppercase tracking-wider text-ink/35">System</p>
            <Link
              href="/admin/system/team"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                pathname === "/admin/system/team" ? "bg-navy/8 text-navy" : "text-ink/65 hover:bg-ink/4 hover:text-ink"
              }`}
            >
              <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />
              Admin team
            </Link>
          </>
        )}
      </nav>

      <div className="shrink-0 border-t border-ink/5 px-4 py-4">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-ember/5 hover:text-ember"
        >
          <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
          Log out
        </button>
      </div>
      {overlay}
    </aside>
  );
}
