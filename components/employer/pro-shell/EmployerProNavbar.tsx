"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";

import { useSignOut } from "@/components/ui/useSignOut";

import { useState, useRef, useEffect } from "react";

import {

  Search,

  Sparkles,

  ChevronDown,

  Building2,

  CreditCard,

  LogOut,

  MoreHorizontal,

} from "lucide-react";

import {

  PRO_PRIMARY_NAV,

  isProNavActive,

  type ProNavBadgeKey,

} from "@/lib/employer/pro-nav-items";

import EmployerSearchTrigger from "@/components/employer/EmployerSearchTrigger";

import EmployerNotificationBell from "@/components/employer/EmployerNotificationBell";

import EmployerThemeToggle from "@/components/employers/EmployerThemeToggle";

import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";

import ProBadge from "@/components/employer/pro/ProBadge";



type NavCounts = {

  activeJobs: number;

  needsReview: number;

  unreadMessages: number;

};



type Props = {

  companyName: string;

  companyLogoUrl?: string | null;

  verifiedStatus: string;

  navCounts: NavCounts;

};



const statusLabel: Record<string, string> = {

  PENDING: "Pending review",

  APPROVED: "Verified",

  REJECTED: "Rejected",

};



const PRO_PRIORITY_NAV = PRO_PRIMARY_NAV.slice(0, 3);

const PRO_OVERFLOW_NAV = PRO_PRIMARY_NAV.slice(3);



function badgeFor(key: ProNavBadgeKey | null | undefined, counts: NavCounts) {

  if (!key) return 0;

  return counts[key];

}



function overflowBadgeCount(counts: NavCounts) {

  return PRO_OVERFLOW_NAV.reduce((sum, item) => sum + badgeFor(item.badgeKey, counts), 0);

}



function NavLink({

  item,

  pathname,

  counts,

  className = "",

}: {

  item: (typeof PRO_PRIMARY_NAV)[number];

  pathname: string;

  counts: NavCounts;

  className?: string;

}) {

  const active = isProNavActive(pathname, item.href);

  const badge = badgeFor(item.badgeKey, counts);



  return (

    <Link

      href={item.href}

      aria-current={active ? "page" : undefined}

      className={`pro-nav-link ${className}`}

    >

      {item.label}

      {badge > 0 && (

        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-marigold px-1 text-[10px] font-bold text-ink">

          {badge > 99 ? "99+" : badge}

        </span>

      )}

    </Link>

  );

}



export default function EmployerProNavbar({

  companyName,

  companyLogoUrl,

  verifiedStatus,

  navCounts,

}: Props) {

  const pathname = usePathname();

  const { signOut, overlay } = useSignOut();

  const [menuOpen, setMenuOpen] = useState(false);

  const [overflowOpen, setOverflowOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const overflowRef = useRef<HTMLDivElement>(null);



  const overflowActive = PRO_OVERFLOW_NAV.some((item) => isProNavActive(pathname, item.href));

  const overflowBadges = overflowBadgeCount(navCounts);



  useEffect(() => {

    if (!menuOpen && !overflowOpen) return;

    function onPointerDown(e: MouseEvent) {

      if (menuOpen && !menuRef.current?.contains(e.target as Node)) setMenuOpen(false);

      if (overflowOpen && !overflowRef.current?.contains(e.target as Node)) setOverflowOpen(false);

    }

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);

  }, [menuOpen, overflowOpen]);



  return (

    <header className="employer-pro-navbar sticky top-0 z-40 shrink-0 border-b border-[var(--pro-border)] px-6 backdrop-blur-md sm:px-6 lg:px-8">

      <div className="mx-auto flex h-[4.25rem] max-w-[1296px] items-center gap-3 lg:gap-5">

        <Link href="/employer/dashboard" className="flex shrink-0 items-center gap-2.5">

          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full shadow-sm" aria-hidden="true">

            <div className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />

            <div

              className="absolute inset-0 bg-[var(--pro-bg)]"

              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}

            />

          </div>

          <span className="hidden font-display text-lg font-bold tracking-tight text-ink sm:inline">

            EasyHire

          </span>

          <ProBadge size="sm" />

        </Link>



        <nav

          className="hidden min-w-0 flex-1 justify-center lg:flex"

          aria-label="Employer Pro navigation"

        >

          <div className="inline-flex max-w-full items-center gap-1 overflow-visible xl:gap-2">
            {PRO_PRIORITY_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} counts={navCounts} className="shrink-0" />
            ))}

            {PRO_OVERFLOW_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                counts={navCounts}
                className="hidden shrink-0 xl:inline-flex"
              />
            ))}

            <div className="relative shrink-0 xl:hidden" ref={overflowRef}>

              <button

                type="button"

                onClick={() => setOverflowOpen((o) => !o)}

                aria-expanded={overflowOpen}

                aria-haspopup="menu"

                aria-current={overflowActive ? "page" : undefined}

                className="pro-nav-link inline-flex items-center gap-1"

              >

                <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden="true" />

                More

                {overflowBadges > 0 && (

                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-marigold px-1 text-[10px] font-bold text-ink">

                    {overflowBadges > 99 ? "99+" : overflowBadges}

                  </span>

                )}

              </button>



              {overflowOpen && (

                <div

                  role="menu"

                  className="pro-card absolute left-1/2 z-50 mt-2 w-44 -translate-x-1/2 overflow-hidden py-1"

                >

                  {PRO_OVERFLOW_NAV.map((item) => {

                    const active = isProNavActive(pathname, item.href);

                    const badge = badgeFor(item.badgeKey, navCounts);

                    return (

                      <Link

                        key={item.href}

                        href={item.href}

                        role="menuitem"

                        aria-current={active ? "page" : undefined}

                        className={`flex items-center justify-between px-3 py-2.5 text-sm transition hover:bg-ink/[0.03] ${

                          active ? "font-semibold text-ink" : "text-ink/75 hover:text-ink"

                        }`}

                        onClick={() => setOverflowOpen(false)}

                      >

                        {item.label}

                        {badge > 0 && (

                          <span className="rounded-full bg-marigold/15 px-1.5 py-0.5 text-xs font-bold text-ink">

                            {badge > 99 ? "99+" : badge}

                          </span>

                        )}

                      </Link>

                    );

                  })}

                </div>

              )}

            </div>

          </div>

        </nav>



        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">

          <div className="hidden min-w-0 md:block lg:max-w-[11rem] xl:max-w-[14rem] 2xl:max-w-xs">

            <EmployerSearchTrigger className="max-w-none" />

          </div>



          <Link

            href="/employer/easy-ai"

            className="hidden shrink-0 items-center gap-1.5 rounded-full bg-marigold/12 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-marigold/18 lg:inline-flex"

            title="Easy AI"

          >

            <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />

            <span className="hidden xl:inline">Easy AI</span>

          </Link>



          <button

            type="button"

            onClick={() =>

              window.dispatchEvent(

                new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })

              )

            }

            className="rounded-lg p-2 text-ink/50 transition hover:bg-ink/[0.04] hover:text-ink md:hidden"

            aria-label="Search"

          >

            <Search className="h-5 w-5" strokeWidth={2} />

          </button>



          <EmployerNotificationBell />

          <EmployerThemeToggle variant="topbar" />



          <div className="relative" ref={menuRef}>

            <button

              type="button"

              onClick={() => setMenuOpen((o) => !o)}

              className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-ink/[0.04]"

              aria-expanded={menuOpen}

              aria-haspopup="menu"

            >

              <EmployerAvatar

                name={companyName}

                imageUrl={companyLogoUrl}

                size="sm"

                shape="rounded"

                fallbackClassName="bg-marigold text-ink"

              />

              <div className="hidden max-w-[7.5rem] text-left xl:block 2xl:max-w-[120px]">

                <span className="block truncate text-sm font-semibold text-ink">{companyName}</span>

                <span className="block truncate text-[11px] text-ink/45">

                  {statusLabel[verifiedStatus] ?? "Employer"}

                </span>

              </div>

              <ChevronDown

                className={`hidden h-4 w-4 text-ink/40 transition-transform xl:block ${menuOpen ? "rotate-180" : ""}`}

                aria-hidden="true"

              />

            </button>



            {menuOpen && (

              <div

                role="menu"

                className="pro-card absolute right-0 z-50 mt-2 w-52 overflow-hidden py-1"

              >

                <Link

                  href="/employer/company-profile"

                  role="menuitem"

                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink/75 transition hover:bg-ink/[0.03] hover:text-ink"

                  onClick={() => setMenuOpen(false)}

                >

                  <Building2 className="h-4 w-4 text-ink/40" strokeWidth={2} aria-hidden="true" />

                  Company profile

                </Link>

                <Link

                  href="/employer/billing"

                  role="menuitem"

                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-ink/75 transition hover:bg-ink/[0.03] hover:text-ink"

                  onClick={() => setMenuOpen(false)}

                >

                  <CreditCard className="h-4 w-4 text-ink/40" strokeWidth={2} aria-hidden="true" />

                  Billing

                </Link>

                <Link

                  href="/employer/easy-ai"

                  role="menuitem"

                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--pro-accent-ink)] transition hover:bg-marigold/[0.06] lg:hidden"

                  onClick={() => setMenuOpen(false)}

                >

                  <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden="true" />

                  Easy AI

                </Link>

                <div className="my-1 border-t border-ink/[0.06]" />

                <button

                  type="button"

                  role="menuitem"

                  onClick={signOut}

                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink/65 transition hover:bg-ink/[0.04] hover:text-ink"

                >

                  <LogOut className="h-4 w-4" strokeWidth={2} aria-hidden="true" />

                  Log out

                </button>

              </div>

            )}

          </div>

        </div>

      </div>

      {overlay}

    </header>

  );

}

