"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Search, Briefcase, HelpCircle, Zap, LogIn } from "lucide-react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const navItems = [
  { label: "Value", icon: Search, hash: "#ValueProps" },
  { label: "How it works", icon: Briefcase, hash: "#HowItWorks" },
  { label: "FAQ", icon: HelpCircle, hash: "#FAQ" },
];

type Props = {
  /** @deprecated — kept for compatibility; behavior is now pathname-driven */
  variant?: "landing" | "static";
};

export default function Header({ variant: _variant }: Props = {}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const headerRef = useRef<HTMLElement>(null);
  const fullNavRef = useRef<HTMLDivElement>(null);
  const compactNavRef = useRef<HTMLDivElement>(null);

  function navHref(hash: string) {
    return isHome ? hash : `/${hash}`;
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
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-center px-4 md:px-32">
        {/* Full pill — visible at top, fades on scroll */}
        <div
          ref={fullNavRef}
          className="absolute inset-x-4 flex items-center justify-between rounded-full border border-white/30 bg-ink/70 px-4 py-2 shadow-2xl backdrop-blur-xl md:inset-x-32"
        >
          <Link href="/" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
              <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
            </div>
            <span className="whitespace-nowrap font-display text-lg font-bold text-mist">EasyHire</span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={navHref(item.hash)}
                className="whitespace-nowrap rounded-full px-5 py-2 text-[15px] font-medium text-mist/75 transition-all duration-300 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/login"
              className="hidden whitespace-nowrap text-[15px] font-medium text-mist/75 transition hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-full bg-white px-7 py-1.5 text-[15px] font-semibold text-ink shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Get started
            </Link>
          </div>
        </div>

        {/* Compact pill — appears on scroll (all public pages) */}
        <div
          ref={compactNavRef}
          className="absolute inline-flex items-center gap-1 rounded-full border border-white/30 bg-ink/85 px-2 py-2 opacity-0 shadow-2xl backdrop-blur-xl"
          style={{ pointerEvents: "none" }}
        >
          <Link
            href="/"
            className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-90"
          >
            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
          </Link>

          <div className="mx-1 h-5 w-px bg-white/15" />

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={navHref(item.hash)}
                  title={item.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-mist/75 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </div>

          <Link
            href="/login"
            title="Log in"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-mist/75 transition-colors duration-300 hover:bg-white/10 hover:text-white sm:flex"
          >
            <LogIn className="h-4 w-4" />
          </Link>

          <Link
            href="/signup"
            title="Get started"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95"
          >
            <Zap className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
