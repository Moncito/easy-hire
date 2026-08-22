"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Briefcase, HelpCircle } from "lucide-react";
import { useLoginModalOptional } from "@/components/auth/LoginModalProvider";

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
  const loginModal = useLoginModalOptional();
  const [scrolled, setScrolled] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setScrolled(true);
      return;
    }

    const onScroll = () => setScrolled(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  function navHref(hash: string) {
    return isHome ? hash : `/${hash}`;
  }

  function handleLoginClick() {
    loginModal?.openLogin();
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`w-full border-b py-5 transition-[background-color,border-color] duration-300 ease-out ${
          scrolled
            ? "border-ink/8 bg-[#FFFDF7]"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12">
          <Link href="/" className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }} />
              <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }} />
            </div>
            <span className="whitespace-nowrap font-display text-lg font-bold text-ink">EasyHire</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={navHref(item.hash)}
                className="whitespace-nowrap rounded-lg px-4 py-2 text-[15px] font-medium text-ink/80 transition-colors duration-200 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            {isHome && loginModal ? (
              <button
                type="button"
                onClick={handleLoginClick}
                className="cursor-pointer whitespace-nowrap text-[14px] font-semibold text-ink/85 transition-colors hover:text-ink"
              >
                Log in
              </button>
            ) : (
              <Link
                href="/login"
                className="whitespace-nowrap text-[14px] font-semibold text-ink/85 transition-colors hover:text-ink"
              >
                Log in
              </Link>
            )}
            <Link
              href="/signup"
              className="whitespace-nowrap rounded-xl bg-ink px-5 py-2 text-[14px] font-semibold text-mist transition-colors hover:bg-navy"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
