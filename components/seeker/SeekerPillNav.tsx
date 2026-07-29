"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  User,
  MessageSquare,
  Briefcase,
  Bookmark,
  Bell,
  LogOut,
} from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const navItems = [
  { label: "Dashboard", href: "/seeker/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/seeker/profile", icon: User },
  { label: "Messages", href: "/seeker/messages", icon: MessageSquare },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Saved", href: "/seeker/saved-jobs", icon: Bookmark },
  { label: "Alerts", href: "/seeker/job-alerts", icon: Bell },
];

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

function initialsFrom(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "S").toUpperCase();
}

export default function SeekerPillNav({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const fullNavRef = useRef<HTMLDivElement>(null);
  const compactNavRef = useRef<HTMLDivElement>(null);
  const initials = initialsFrom(userName, userEmail);
  const displayName = userName?.trim() || userEmail || "Seeker";

  function isActive(href: string) {
    if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
    if (href === "/seeker/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "160 top",
          scrub: 0.4,
        },
      });

      tl.to(headerRef.current, { paddingTop: 10, ease: "power2.out" }, 0);
      tl.to(fullNavRef.current, { opacity: 0, y: -10, scale: 0.97, ease: "power2.out" }, 0);
      tl.to(compactNavRef.current, { opacity: 1, y: 0, scale: 1, ease: "power2.out" }, 0);
    });

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "160 top",
      onUpdate: (self) => {
        const compact = self.progress > 0.5;
        if (fullNavRef.current) {
          fullNavRef.current.style.pointerEvents = compact ? "none" : "auto";
        }
        if (compactNavRef.current) {
          compactNavRef.current.style.pointerEvents = compact ? "auto" : "none";
        }
      },
    });

    return () => {
      ctx.revert();
      st.kill();
    };
  }, [pathname]);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: 20 }}>
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-center px-4 md:px-16 lg:px-24">
        {/* Full pill */}
        <div
          ref={fullNavRef}
          className="absolute inset-x-4 flex items-center justify-between rounded-full border border-white/30 bg-ink/70 px-3 py-2 shadow-2xl backdrop-blur-xl sm:px-4 md:inset-x-16 lg:inset-x-24"
        >
          <Link href="/seeker/dashboard" className="flex shrink-0 cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
              <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
            </div>
            <span className="hidden whitespace-nowrap font-display text-lg font-bold text-mist sm:inline">
              EasyHire
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium transition-all duration-300 ${
                    active
                      ? "bg-marigold/25 text-marigold"
                      : "text-mist/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-marigold/30 font-display text-xs font-bold text-mist">
                {initials}
              </div>
              <span className="max-w-[120px] truncate text-[13px] font-medium text-mist/80 lg:max-w-[160px]">
                {displayName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="cursor-pointer rounded-full px-3 py-1.5 text-[13px] font-medium text-mist/70 transition hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Compact pill */}
        <div
          ref={compactNavRef}
          className="absolute inline-flex items-center gap-1 rounded-full border border-white/30 bg-ink/85 px-2 py-2 opacity-0 shadow-2xl backdrop-blur-xl"
          style={{ pointerEvents: "none" }}
        >
          <Link
            href="/seeker/dashboard"
            className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full transition-opacity hover:opacity-90"
            title="Dashboard"
          >
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
          </Link>

          <div className="mx-1 h-5 w-px bg-white/15" />

          <div className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 ${
                    active
                      ? "bg-marigold/25 text-marigold"
                      : "text-mist/75 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            title="Sign out"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-mist/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
