"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  User,
  MessageSquare,
  Briefcase,
  Bookmark,
  Bell,
  LogOut,
} from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";

const navItems = [
  { label: "Dashboard", href: "/seeker/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/seeker/profile", icon: User },
  { label: "Messages", href: "/seeker/messages", icon: MessageSquare },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Saved", href: "/seeker/saved-jobs", icon: Bookmark },
  { label: "Alerts", href: "/seeker/job-alerts", icon: Bell },
];

import SeekerMobileBottomNav from "@/components/seeker/SeekerMobileBottomNav";
import SeekerNotificationBell from "@/components/seeker/SeekerNotificationBell";

type Props = {
  userName?: string | null;
  userEmail?: string | null;
};

type IslandWidths = { compact: number; expanded: number };

function isActive(pathname: string, href: string) {
  if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
  if (href === "/seeker/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

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

function canHover() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

function LogoMark() {
  return (
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
      <div
        className="absolute inset-0 bg-marigold"
        style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }}
      />
      <div
        className="absolute inset-0 bg-teal"
        style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
      />
    </div>
  );
}

export default function SeekerPillNav({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const { signOut, overlay } = useSignOut();
  const shellRef = useRef<HTMLDivElement>(null);
  const compactRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [widths, setWidths] = useState<IslandWidths | null>(null);
  const initials = initialsFrom(userName, userEmail);

  const collapse = useCallback(() => setExpanded(false), []);

  useLayoutEffect(() => {
    const compactEl = compactRef.current;
    const expandedEl = expandedRef.current;
    if (!compactEl || !expandedEl) return;

    const update = () => {
      setWidths({
        compact: compactEl.scrollWidth,
        expanded: expandedEl.scrollWidth,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(compactEl);
    ro.observe(expandedEl);
    return () => ro.disconnect();
  }, [isTouchDevice]);

  useEffect(() => {
    setIsTouchDevice(!window.matchMedia("(hover: hover)").matches);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    function handleClickOutside(e: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        collapse();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, collapse]);

  useEffect(() => {
    collapse();
  }, [pathname, collapse]);

  useEffect(() => {
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, []);

  function handleMouseEnter() {
    if (!canHover()) return;
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    setExpanded(true);
  }

  function handleMouseLeave() {
    if (!canHover()) return;
    collapseTimer.current = setTimeout(() => setExpanded(false), 120);
  }

  function handleFocusIn() {
    if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
      collapseTimer.current = null;
    }
    setExpanded(true);
  }

  function handleFocusOut(e: React.FocusEvent<HTMLDivElement>) {
    if (!shellRef.current?.contains(e.relatedTarget as Node)) {
      collapseTimer.current = setTimeout(() => setExpanded(false), 120);
    }
  }

  const linkTone = (href: string) => {
    const active = isActive(pathname, href);
    return active
      ? "bg-marigold/25 text-marigold"
      : "text-mist/75 hover:bg-white/10 hover:text-white";
  };

  const shellWidth = widths ? (expanded ? widths.expanded : widths.compact) : undefined;

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden items-start justify-center gap-2 pt-3 lg:flex">
      <div
        ref={shellRef}
        role="navigation"
        aria-label="Seeker navigation"
        aria-expanded={expanded}
        data-state={expanded ? "expanded" : "compact"}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={handleFocusIn}
        onBlurCapture={handleFocusOut}
        style={{ width: shellWidth, visibility: widths ? "visible" : "hidden" }}
        className={[
          "seeker-island-outer pointer-events-auto relative min-h-[44px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-full border border-white/20 bg-ink/90 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:max-w-[min(calc(100vw-2rem),64rem)]",
          expanded ? "shadow-[0_14px_44px_rgba(0,0,0,0.34)]" : "",
        ].join(" ")}
      >
        {/* Compact layer — icons only */}
        <div
          ref={compactRef}
          aria-hidden={expanded}
          className={[
            "seeker-island-layer absolute inset-y-0 left-0 flex items-center gap-0.5 px-2 py-1.5",
            expanded ? "pointer-events-none opacity-0" : "opacity-100",
          ].join(" ")}
        >
          <Link
            href="/seeker/dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center hover:opacity-90"
            aria-label="EasyHire dashboard"
            tabIndex={expanded ? -1 : 0}
          >
            <LogoMark />
          </Link>

          <div className="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />

          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  tabIndex={expanded ? -1 : 0}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${linkTone(item.href)}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            tabIndex={expanded ? -1 : 0}
            onClick={signOut}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist/75 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {isTouchDevice && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-label="Expand navigation menu"
              tabIndex={expanded ? -1 : 0}
              onClick={() => setExpanded(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist/60 hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden="true">
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Expanded layer — full labels */}
        <div
          ref={expandedRef}
          aria-hidden={!expanded}
          className={[
            "seeker-island-layer absolute inset-y-0 left-0 flex items-center gap-1 px-3 py-1.5",
            expanded ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          <Link
            href="/seeker/dashboard"
            className="flex shrink-0 items-center gap-2 hover:opacity-90"
            aria-label="EasyHire dashboard"
            tabIndex={expanded ? 0 : -1}
          >
            <LogoMark />
            <span className="whitespace-nowrap font-display text-sm font-bold text-mist">
              EasyHire
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  tabIndex={expanded ? 0 : -1}
                  className={`flex h-8 shrink-0 items-center rounded-full px-2.5 transition-colors duration-150 ${linkTone(item.href)}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="ml-1.5 whitespace-nowrap text-[13px] font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />

          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marigold/30 font-display text-[10px] font-bold text-mist"
            title={userName?.trim() || userEmail || "Seeker"}
          >
            {initials}
          </div>

          <button
            type="button"
            tabIndex={expanded ? 0 : -1}
            onClick={signOut}
            className="shrink-0 cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium text-mist/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Fixed square so `rounded-full` stays a true circle: the 32px bell
          inside would otherwise leave this 40x44 and render as an ellipse.
          44x44 around a 32px control also matches the nav island's own
          min-h-[44px]-around-h-8 rhythm. */}
      <div className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-ink/90 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <SeekerNotificationBell variant="dark" size="sm" />
      </div>
    </header>
    <SeekerMobileBottomNav />
    {overlay}
    </>
  );
}
