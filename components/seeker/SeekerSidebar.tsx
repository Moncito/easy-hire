"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Briefcase, LogOut, MessageSquare } from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";

const navItems = [
  { label: "Dashboard", href: "/seeker/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/seeker/profile", icon: User },
  { label: "Messages", href: "/seeker/messages", icon: MessageSquare },
  { label: "Browse Jobs", href: "/jobs", icon: Briefcase },
];

export default function SeekerSidebar() {
  const pathname = usePathname();
  const { signOut, overlay } = useSignOut();

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
          const isActive =
            pathname === item.href ||
            (item.href !== "/seeker/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-marigold/10 text-ink shadow-xs"
                  : "text-ink/60 hover:bg-ink/4 hover:text-ink"
              }`}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-ink/8 p-4">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/55 transition-colors hover:bg-ink/4 hover:text-ink"
        >
          <LogOut className="h-4.5 w-4.5" strokeWidth={2} />
          Sign out
        </button>
      </div>
      {overlay}
    </aside>
  );
}
