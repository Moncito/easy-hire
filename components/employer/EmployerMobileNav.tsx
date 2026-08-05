"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  Menu,
  Search,
  Building2,
  LogOut,
  X,
} from "lucide-react";

const primaryTabs = [
  { label: "Home", href: "/employer/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/employer/jobs", icon: Briefcase },
  { label: "Applicants", href: "/employer/applicants", icon: Users },
  { label: "Messages", href: "/employer/messages", icon: MessageSquare },
] as const;

const overflowLinks = [
  { label: "Talent search", href: "/employer/talent", icon: Search },
  { label: "Company profile", href: "/employer/company-profile", icon: Building2 },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/employer/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function EmployerMobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const overflowActive = overflowLinks.some((link) => isActive(pathname, link.href));

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
        <div className="employer-sheet-enter fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border border-ink/8 bg-white p-4 shadow-2xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">More</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1">
            {overflowLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-teal/10 text-teal" : "text-ink/70 hover:bg-ink/[0.03]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} />
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ember transition-colors hover:bg-ember/5"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Log out
            </button>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-ink/8 bg-mist/95 backdrop-blur-md lg:hidden"
        aria-label="Employer mobile navigation"
      >
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? "text-teal" : "text-ink/45"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "scale-105" : ""}`} strokeWidth={active ? 2.25 : 2} />
              {tab.label}
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
    </>
  );
}
