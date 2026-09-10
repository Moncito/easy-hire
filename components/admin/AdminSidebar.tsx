"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  ChevronDown,
  Flag,
  Layers,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Company verifications", href: "/admin/companies", icon: Building2 },
  { label: "Seeker verifications", href: "/admin/seekers/verifications", icon: ShieldCheck },
  { label: "Job approvals", href: "/admin/jobs", icon: Briefcase },
  { label: "Review disputes", href: "/admin/reviews", icon: Flag },
];

// New unified moderation queues (docs/ADMIN-CONSOLE-PLAN.md §3/§4.2) — the
// old per-kind links above stay exactly as they are until the shell is
// verified in a browser (see the plan's Phase 1 breakdown: "Old routes
// redirect ... Deliberately last"). Both nav groups are live at once.
const queueItems = [
  { label: "Companies", href: "/admin/queues/companies" },
  { label: "Seekers", href: "/admin/queues/seekers" },
  { label: "Jobs", href: "/admin/queues/jobs" },
  { label: "Reviews", href: "/admin/queues/reviews" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, overlay } = useSignOut();
  const queuesActive = pathname.startsWith("/admin/queues");
  const [queuesOpen, setQueuesOpen] = useState(true);

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

        <p className="mt-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink/30">Legacy queue pages</p>
        {navItems
          .filter((item) => item.href !== "/admin/dashboard")
          .map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive ? "bg-navy/8 text-navy" : "text-ink/65 hover:bg-ink/4 hover:text-ink"
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
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
