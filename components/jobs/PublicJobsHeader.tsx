"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Briefcase, LogIn, Zap, LayoutDashboard } from "lucide-react";
import NavBackdropShield from "@/components/jobs/NavBackdropShield";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import SeekerPillNav from "@/components/seeker/SeekerPillNav";

function GuestJobsPillNav() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const fullNavRef = useRef<HTMLDivElement>(null);
  const compactNavRef = useRef<HTMLDivElement>(null);

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
    <>
      <NavBackdropShield />
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: 20 }}>
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-center px-4 md:px-16 lg:px-24">
        <div
          ref={fullNavRef}
          className="absolute inset-x-4 flex items-center justify-between rounded-full border border-white/30 bg-ink/70 px-3 py-2 shadow-2xl backdrop-blur-xl sm:px-4 md:inset-x-16 lg:inset-x-24"
        >
          <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
              <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
            </div>
            <span className="whitespace-nowrap font-display text-lg font-bold text-mist">EasyHire</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/jobs"
              className="cursor-pointer whitespace-nowrap rounded-full bg-marigold/25 px-4 py-2 text-[14px] font-medium text-marigold transition-all"
            >
              Browse jobs
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="hidden cursor-pointer whitespace-nowrap text-[15px] font-medium text-mist/75 transition hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="cursor-pointer whitespace-nowrap rounded-full bg-white px-6 py-1.5 text-[15px] font-semibold text-ink shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>

        <div
          ref={compactNavRef}
          className="absolute inline-flex items-center gap-1 rounded-full border border-white/30 bg-ink/85 px-2 py-2 opacity-0 shadow-2xl backdrop-blur-xl"
          style={{ pointerEvents: "none" }}
        >
          <Link
            href="/"
            className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-full transition-opacity hover:opacity-90"
          >
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
          </Link>
          <div className="mx-1 h-5 w-px bg-white/15" />
          <Link
            href="/jobs"
            title="Browse jobs"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-marigold/25 text-marigold"
          >
            <Briefcase className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            title="Log in"
            className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full text-mist/75 transition-colors hover:bg-white/10 hover:text-white sm:flex"
          >
            <LogIn className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            title="Get started"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <Zap className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
    </>
  );
}

function RoleDashboardPill({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <>
      <NavBackdropShield />
      <header className="fixed inset-x-0 top-0 z-50" style={{ paddingTop: 20 }}>
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-center px-4 md:px-16 lg:px-24">
        <div className="absolute inset-x-4 flex items-center justify-between rounded-full border border-white/30 bg-ink/70 px-3 py-2 shadow-2xl backdrop-blur-xl sm:px-4 md:inset-x-16 lg:inset-x-24">
          <Link href="/" className="flex shrink-0 cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
              <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
            </div>
            <span className="whitespace-nowrap font-display text-lg font-bold text-mist">EasyHire</span>
          </Link>
          <Link
            href="/jobs"
            className="cursor-pointer whitespace-nowrap rounded-full bg-marigold/25 px-4 py-2 text-[14px] font-medium text-marigold"
          >
            Browse jobs
          </Link>
          <Link
            href={href}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-1.5 text-[14px] font-semibold text-ink shadow-lg transition hover:scale-105"
          >
            <LayoutDashboard className="h-4 w-4" />
            {label}
          </Link>
        </div>
      </div>
    </header>
    </>
  );
}

export default function PublicJobsHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const onJobs = pathname.startsWith("/jobs");

  if (status === "loading") {
    if (onJobs) return null;
    return (
      <header className="fixed inset-x-0 top-0 z-50 h-[88px]" aria-hidden="true" />
    );
  }

  if (session?.user?.role === "SEEKER") {
    return (
      <SeekerPillNav
        userName={session.user.name}
        userEmail={session.user.email}
      />
    );
  }

  if (session?.user?.role === "EMPLOYER") {
    return <RoleDashboardPill href="/employer/dashboard" label="Employer dashboard" />;
  }

  if (session?.user?.role === "ADMIN") {
    return <RoleDashboardPill href="/admin/dashboard" label="Admin console" />;
  }

  if (onJobs) return null;

  return <GuestJobsPillNav />;
}
