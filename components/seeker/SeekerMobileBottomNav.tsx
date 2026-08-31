"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Bookmark,
  User,
} from "lucide-react";
import SeekerNotificationBell from "@/components/seeker/SeekerNotificationBell";

const tabs = [
  { label: "Home", href: "/seeker/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Messages", href: "/seeker/messages", icon: MessageSquare },
  { label: "Saved", href: "/seeker/saved-jobs", icon: Bookmark },
  { label: "Profile", href: "/seeker/profile", icon: User },
] as const;

function isTabActive(pathname: string, href: string) {
  if (href === "/jobs") return pathname === "/jobs" || pathname.startsWith("/jobs/");
  if (href === "/seeker/dashboard") return pathname === href;
  if (href === "/seeker/profile") {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`) ||
      pathname.startsWith("/seeker/job-alerts")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function activeTabIndex(pathname: string) {
  const index = tabs.findIndex((tab) => isTabActive(pathname, tab.href));
  return index >= 0 ? index : 0;
}

export default function SeekerMobileBottomNav() {
  const pathname = usePathname();
  const pillRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const highlightIndex = activeTabIndex(pathname);
  const [activeCenter, setActiveCenter] = useState(0);
  const [motionReady, setMotionReady] = useState(false);

  const syncLayout = useCallback(() => {
    const pill = pillRef.current;
    const slot = slotRefs.current[highlightIndex];
    if (!pill || !slot) return;

    const pillRect = pill.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    setActiveCenter(slotRect.left + slotRect.width / 2 - pillRect.left);
  }, [highlightIndex]);

  useLayoutEffect(() => {
    syncLayout();
  }, [syncLayout, pathname]);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const observer = new ResizeObserver(syncLayout);
    observer.observe(pill);
    window.addEventListener("resize", syncLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncLayout);
    };
  }, [syncLayout]);

  useLayoutEffect(() => {
    const id = window.setTimeout(() => setMotionReady(true), 40);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <nav
      aria-label="Seeker navigation"
      className="seeker-mobile-bottom-nav pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center lg:hidden"
    >
      <div className="flex w-[min(100%,24rem)] items-end gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-4">
        <div
          ref={pillRef}
          className="pointer-events-auto relative flex h-14 flex-1 items-center overflow-hidden rounded-full bg-white shadow-[0_8px_28px_rgba(32,36,43,0.14)] ring-1 ring-ink/10"
        >
          {activeCenter > 0 ? (
            <div
              className={[
                "pointer-events-none absolute top-1/2 z-0 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-marigold",
                motionReady ? "seeker-bottom-fab" : "",
              ].join(" ")}
              style={{ left: activeCenter }}
              aria-hidden="true"
            />
          ) : null}

          <div className="relative z-10 flex h-full w-full px-1">
            {tabs.map((tab, index) => {
              const active = index === highlightIndex;
              const Icon = tab.icon;

              return (
                <Link
                  key={tab.href}
                  ref={(el) => {
                    slotRefs.current[index] = el;
                  }}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-1 items-center justify-center text-ink outline-none focus-visible:[&_svg]:rounded-sm focus-visible:[&_svg]:ring-2 focus-visible:[&_svg]:ring-marigold focus-visible:[&_svg]:ring-offset-2"
                >
                  <Icon
                    className="h-[19px] w-[19px] shrink-0"
                    strokeWidth={active ? 2.5 : 2.25}
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_28px_rgba(32,36,43,0.14)] ring-1 ring-ink/10">
          <SeekerNotificationBell variant="light" dropDirection="up" />
        </div>
      </div>
    </nav>
  );
}
