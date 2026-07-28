"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Briefcase, Building2, Users, BarChart3, LogOut, MessageSquare, Search } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard },
  { label: "Job Postings", href: "/employer/jobs", icon: Briefcase },
  { label: "Applicants", href: "/employer/applicants", icon: Users },
  { label: "Messages", href: "/employer/messages", icon: MessageSquare },
  { label: "Talent Search", href: "/employer/talent", icon: Search },
  { label: "Company Profile", href: "/employer/company-profile", icon: Building2 },
  { label: "Reports", href: "/employer/reports", icon: BarChart3, disabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-ink/10 bg-white">
      <div className="shrink-0 px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 px-3 transition-transform hover:scale-[1.02]">
          <div className="relative h-8 w-8 overflow-hidden rounded-full shadow-sm shadow-black/10">
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">EasyHire</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/employer/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          if (item.disabled) {
            return (
              <div
                key={item.href}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink/30 cursor-not-allowed select-none"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  {item.label}
                </div>
                <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase text-ink/40">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? "bg-teal/8 text-teal shadow-xs" 
                  : "text-ink/65 hover:bg-ink/4 hover:text-ink"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-teal" : "text-ink/50 group-hover:text-ink"}`} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-ink/5 px-4 py-4">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/60 transition-all hover:bg-ember/5 hover:text-ember cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 text-ink/40" strokeWidth={2} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}