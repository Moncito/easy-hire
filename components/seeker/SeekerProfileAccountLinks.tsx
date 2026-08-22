"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronRight, LogOut } from "lucide-react";

export default function SeekerProfileAccountLinks() {
  const pathname = usePathname();
  const alertsActive =
    pathname === "/seeker/job-alerts" || pathname.startsWith("/seeker/job-alerts/");

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-3 md:hidden">
      <Link
        href="/seeker/job-alerts"
        className={`group flex flex-1 items-center justify-between gap-3 rounded-2xl px-4 py-3.5 ring-1 transition ${
          alertsActive
            ? "bg-marigold/10 ring-marigold/25"
            : "bg-ink/[0.03] ring-ink/8 hover:bg-ink/[0.05]"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-ink/8">
            <Bell className="h-4 w-4 text-ink" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Job alerts</span>
            <span className="block text-xs text-ink/50">Manage saved search alerts</span>
          </span>
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-ink/50"
          aria-hidden="true"
        />
      </Link>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex flex-1 items-center justify-between gap-3 rounded-2xl bg-ink/[0.03] px-4 py-3.5 ring-1 ring-ink/8 transition hover:bg-ink/[0.05] sm:max-w-[12rem]"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-ink/8">
            <LogOut className="h-4 w-4 text-ink/70" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-ink/75">Sign out</span>
        </span>
      </button>
    </div>
  );
}
