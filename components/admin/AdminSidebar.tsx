"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Building2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Company verifications", href: "/admin/companies", icon: Building2 },
  { label: "Job approvals", href: "/admin/jobs", icon: Briefcase },
];

export default function AdminSidebar() {
  const pathname = usePathname();

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
        {navItems.map((item) => {
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
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 hover:bg-ember/5 hover:text-ember"
        >
          <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}
