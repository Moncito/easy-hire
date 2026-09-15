"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Command, Moon, Search, Sun } from "lucide-react";
import { OPEN_EVENT_NAME as PALETTE_OPEN_EVENT_NAME } from "./CommandPalette";
import { ADMIN_QUEUE_NAV_ITEMS } from "./adminQueueNav";
import type { QueueKind } from "@/lib/admin/queues";

/**
 * docs/ADMIN-UI-UPGRADE.md "Your suggestions" — the header was "plain... just
 * shows the page we're at and a search bar that cannot be clicked." Four
 * changes:
 *
 *  1. **Real page title.** Was a static "Admin Console" label regardless of
 *     which screen was open — now derived from the pathname (longest-prefix
 *     match against ADMIN_ROUTE_LABELS below), so it actually says where you
 *     are, matching the ask.
 *  2. **Clickable search.** The `⌘K jump to…` hint was a bare, non-interactive
 *     `<kbd>` — opening the palette required already knowing the shortcut.
 *     Now a real button. It can't hold the palette's own `open` state
 *     directly (this header and CommandPalette are independent siblings
 *     under app/admin/layout.tsx, a Server Component that can't hold
 *     client-only state itself), so it dispatches the custom
 *     `PALETTE_OPEN_EVENT_NAME` window event CommandPalette.tsx listens for
 *     — the lightest way for one client component to command another
 *     without lifting state into a shared context neither otherwise needs.
 *  3. **Light/dark toggle.** `data-admin-theme="dark"|"light"` written
 *     directly onto `document.documentElement`, read by the `admin-dark:`
 *     Tailwind custom variant (app/globals.css) that AdminSidebar.tsx and
 *     this file's own chrome both use. Deliberately NOT a React
 *     context/provider: nothing else in this component tree needs to know
 *     the current theme in its OWN render logic — the sidebar re-themes
 *     itself purely through the CSS cascade reacting to the DOM attribute,
 *     no cross-component state sync required. Persisted to localStorage,
 *     hydrated after mount the same way EmployerPageThemeProvider.tsx
 *     hydrates its own theme preference (a browser-only value has no
 *     SSR-safe way to be known before the client mounts).
 *
 *     SCOPE, stated plainly: this toggle currently themes the persistent
 *     chrome only — this header, the sidebar, and the page background
 *     (app/admin/layout.tsx). Nothing inside individual admin PAGES (the
 *     tables, cards, forms across /admin/queues, /admin/users, /admin/trust,
 *     etc.) has a dark variant yet — reskinning ~15 pages' worth of content
 *     is a separate, much larger pass than "add a button," left for a
 *     follow-up rather than attempted here.
 *  4. **Pending-items bell.** The one thing judged worth adding beyond the
 *     literal ask — reuses the exact `getQueueHealth()` data the sidebar's
 *     own badges already fetch (docs/ADMIN-UI-UPGRADE.md's sidebar work),
 *     surfaced here as a real dropdown (not just a bare count) matching the
 *     existing `SeekerNotificationBell.tsx` interaction pattern: poll every
 *     60s, click-outside to close, Escape returns focus to the trigger,
 *     focus moves into the panel on open, an `aria-live` region for the
 *     unread-style announcement.
 */

type QueueHealthEntry = { kind: QueueKind; depth: number; slaBreaches: number };

const THEME_STORAGE_KEY = "eh-admin-theme";
type AdminTheme = "light" | "dark";

const PENDING_POLL_MS = 60_000;

/** Longest-prefix match first — a page one level deeper than a listed route (e.g. `/admin/users/[id]`) still resolves to something reasonable via its parent's label plus a generic suffix, rather than falling through to nothing. */
const ADMIN_ROUTE_LABELS: { prefix: string; label: string; exact?: boolean }[] = [
  { prefix: "/admin/dashboard", label: "Dashboard", exact: true },
  { prefix: "/admin/queues/companies", label: "Companies queue" },
  { prefix: "/admin/queues/seekers", label: "Seekers queue" },
  { prefix: "/admin/queues/jobs", label: "Jobs queue" },
  { prefix: "/admin/queues/reviews", label: "Reviews queue" },
  { prefix: "/admin/queues/reports", label: "Reports queue" },
  { prefix: "/admin/queues", label: "Queues overview", exact: true },
  { prefix: "/admin/companies", label: "Company access" },
  { prefix: "/admin/users", label: "Users" },
  { prefix: "/admin/jobs/directory", label: "Jobs directory" },
  { prefix: "/admin/trust", label: "Trust scores" },
  { prefix: "/admin/audit", label: "Audit log" },
  { prefix: "/admin/system/flags", label: "Feature flags" },
  { prefix: "/admin/system/team", label: "Admin team" },
  { prefix: "/admin/system", label: "System health" },
  { prefix: "/admin/forbidden", label: "Access restricted" },
];

/** First one or two letters of the email's local part, uppercased — e.g. "employer@x.com" -> "EM". No display name is available here (only email + level), so this is the best identity glyph on hand. */
function initialsFor(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local.slice(0, 2).toUpperCase() || "?";
}

function pageTitleFor(pathname: string): string {
  let best: { prefix: string; label: string } | null = null;
  for (const route of ADMIN_ROUTE_LABELS) {
    const matches = route.exact ? pathname === route.prefix : pathname.startsWith(route.prefix);
    if (matches && (!best || route.prefix.length > best.prefix.length)) {
      best = route;
    }
  }
  return best?.label ?? "Admin Console";
}

export type AdminHeaderIdentity = {
  email: string;
  level: string;
};

export default function AdminHeader({ identity }: { identity: AdminHeaderIdentity }) {
  const pathname = usePathname();
  const pageTitle = pageTitleFor(pathname);

  // ==========================================================================
  // Theme toggle
  // ==========================================================================
  const [theme, setTheme] = useState<AdminTheme>("light");
  const [themeHydrated, setThemeHydrated] = useState(false);

  useLayoutEffect(() => {
    let stored: AdminTheme = "light";
    try {
      const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === "dark" || raw === "light") stored = raw;
    } catch {
      // localStorage unavailable — stay light.
    }
    // Same intentional client-only hydration read as
    // EmployerPageThemeProvider.tsx / AdminSidebar.tsx's own collapse state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only hydration
    setTheme(stored);
    setThemeHydrated(true);
  }, []);

  useEffect(() => {
    if (!themeHydrated) return;
    document.documentElement.dataset.adminTheme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Failed write just means the preference doesn't persist.
    }
  }, [theme, themeHydrated]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.adminTheme;
    };
  }, []);

  // ==========================================================================
  // Pending-items bell — same interaction shape as SeekerNotificationBell.tsx
  // ==========================================================================
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState<QueueHealthEntry[] | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      fetch("/api/admin/queues/health", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((body: { health: QueueHealthEntry[] } | null) => {
          if (cancelled || !body) return;
          setHealth(body.health);
          const total = body.health.reduce((sum, h) => sum + h.depth, 0);
          setStatusMessage(total > 0 ? `${total} item${total === 1 ? "" : "s"} pending across queues` : "");
        })
        .catch(() => {
          // Next poll retries — a missed refresh isn't worth surfacing as an error.
        });
    };
    run();
    const interval = window.setInterval(run, PENDING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const pending = (health ?? []).filter((h) => h.depth > 0);
  const totalPending = pending.reduce((sum, h) => sum + h.depth, 0);
  const anyBreach = pending.some((h) => h.slaBreaches > 0);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink/5 bg-white/95 px-8 shadow-xs backdrop-blur-sm admin-dark:border-white/8 admin-dark:bg-admin-dark-surface/95">
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-ink admin-dark:text-mist">{pageTitle}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/35 admin-dark:text-mist/30">
          Admin Console
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Clickable search trigger — was a bare, non-interactive <kbd>. Wider
            and higher-contrast than the first pass: at a glance it read as a
            small decorative label rather than an actual search box, which
            undersold the fact that it's now a real clickable control. */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(PALETTE_OPEN_EVENT_NAME))}
          aria-label="Search — jump to a user, company or job"
          className="hidden w-56 items-center gap-2 rounded-lg border border-ink/15 bg-mist px-3 py-2 text-xs text-ink/55 transition hover:border-navy/30 hover:bg-white hover:text-ink/80 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy sm:inline-flex admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist/55 admin-dark:hover:border-white/25 admin-dark:hover:bg-white/10 admin-dark:hover:text-mist/90"
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-navy/70 admin-dark:text-teal/80" aria-hidden="true" />
          <span className="flex-1 text-left">Jump to…</span>
          <span className="inline-flex items-center gap-0.5 rounded border border-ink/15 bg-white px-1 py-0.5 font-data text-[10px] text-ink/40 admin-dark:border-white/15 admin-dark:bg-white/10 admin-dark:text-mist/45">
            <Command className="h-2.5 w-2.5" aria-hidden="true" />K
          </span>
        </button>

        {/* Theme toggle — Marigold for Sun (light mode, warm), Navy for Moon
            (dark mode, cool): a literal, low-effort application of the same
            "icons carry real color" rule the sidebar already follows, rather
            than leaving this one plain gray while everything else got color. */}
        <button
          type="button"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink/45 transition hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:hover:bg-white/8"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4 text-navy" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 text-marigold" strokeWidth={2} aria-hidden="true" />
          )}
        </button>

        {/* Pending-items bell — Navy at rest (matches the sidebar's own
            "shared/structural" icon color for the Queues group this bell
            mirrors), not plain gray. */}
        <div className="relative" ref={wrapperRef}>
          <div role="status" aria-live="polite" className="sr-only">
            {statusMessage}
          </div>

          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            aria-label={`Pending items${totalPending > 0 ? `, ${totalPending} across queues` : ""}`}
            aria-haspopup="true"
            aria-expanded={open}
            aria-controls={panelId}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy/70 transition hover:bg-ink/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:text-teal/70 admin-dark:hover:bg-white/8 admin-dark:hover:text-teal"
          >
            <Bell className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {totalPending > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 font-data text-[8px] font-bold ${
                  anyBreach ? "bg-ember text-white" : "bg-navy text-white"
                }`}
              >
                {totalPending > 9 ? "9+" : totalPending}
              </span>
            )}
          </button>

          {open && (
            <div
              id={panelId}
              ref={panelRef}
              role="region"
              aria-label="Pending items"
              tabIndex={-1}
              className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xl outline-none admin-dark:border-white/10 admin-dark:bg-admin-dark-surface"
            >
              <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3 admin-dark:border-white/8">
                <p className="font-display text-sm font-bold text-ink admin-dark:text-mist">Pending items</p>
                {totalPending > 0 && (
                  <span className="font-data text-xs font-semibold text-ink/45 admin-dark:text-mist/45">
                    {totalPending} total
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {pending.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink/40 admin-dark:text-mist/35">
                    Nothing pending — every queue is clear.
                  </p>
                ) : (
                  pending.map((h) => {
                    const item = ADMIN_QUEUE_NAV_ITEMS.find((q) => q.kind === h.kind);
                    if (!item) return null;
                    const breached = h.slaBreaches > 0;
                    return (
                      <Link
                        key={h.kind}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 border-b border-ink/5 px-4 py-3 text-sm transition hover:bg-ink/[0.02] admin-dark:border-white/8 admin-dark:hover:bg-white/5"
                      >
                        <span className="flex items-center gap-2">
                          {breached && (
                            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                          )}
                          <span className={breached ? "font-semibold text-ember" : "text-ink/80 admin-dark:text-mist/80"}>
                            {item.label}
                            {breached && <span className="sr-only"> (SLA breached)</span>}
                          </span>
                        </span>
                        <span className="font-data text-xs font-bold text-ink/50 admin-dark:text-mist/50">
                          {h.depth}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>
              <Link
                href="/admin/queues"
                onClick={() => setOpen(false)}
                className="block border-t border-ink/5 px-4 py-2.5 text-center text-xs font-semibold text-navy hover:underline admin-dark:border-white/8 admin-dark:text-teal"
              >
                View all queues
              </Link>
            </div>
          )}
        </div>

        {/* Admin identity — passive display; sign-out already lives in the
            sidebar. Initials avatar added for the same reason the sidebar
            got a circular logo mark: a bare text-only identity read as
            unfinished next to everything else that got a real visual
            treatment. */}
        <div className="hidden items-center gap-2.5 border-l border-ink/10 pl-3 md:flex admin-dark:border-white/10">
          <div className="text-right leading-tight">
            <p className="max-w-[10rem] truncate text-xs font-semibold text-ink admin-dark:text-mist">
              {identity.email}
            </p>
            <p className="font-data text-[10px] text-ink/40 admin-dark:text-mist/40">{identity.level}</p>
          </div>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-data text-[11px] font-bold text-white admin-dark:bg-navy/80"
            aria-hidden="true"
          >
            {initialsFor(identity.email)}
          </div>
        </div>
      </div>
    </header>
  );
}
