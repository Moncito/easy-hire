"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  ChevronDown,
  Layers,
  LogOut,
  Users,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  ScrollText,
  Activity,
  Flag,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSignOut } from "@/components/ui/useSignOut";
import {
  ADMIN_QUEUE_NAV_ITEMS as queueItems,
  QUEUE_ICON_COLOR,
  QUEUE_KIND_ICON,
} from "./adminQueueNav";
import type { QueueKind } from "@/lib/admin/queues";

/**
 * docs/ADMIN-UI-UPGRADE.md "Your suggestions" — three changes on top of the
 * existing permission-gated nav:
 *  1. Collapsible to an icons-only rail (persisted, `--eh-sidebar-w` CSS var
 *     bridges the width to app/admin/layout.tsx the same way
 *     ImpersonationBanner.tsx bridges its own height).
 *  2. Icons carry real color instead of inheriting plain ink — mapped from
 *     the SAME semantic system CLAUDE.md already defines (Marigold =
 *     seeker-side, Teal = employer-side, Navy = shared/structural) rather
 *     than inventing new colors. Ember is deliberately NOT used here — it
 *     stays reserved for genuine warning states (CLAUDE.md: "Ember only for
 *     genuine warnings/rejections"), which is exactly what the badges below
 *     use it for.
 *  3. Live pending-count badges on the queue links, sourced from
 *     `getQueueHealth()` (lib/admin/queues.ts) via the new
 *     GET /api/admin/queues/health — the same depth/SLA-breach numbers the
 *     `/admin/queues` index page already renders as cards, reused rather
 *     than reimplemented. A badge turns Ember only when that queue has a
 *     real SLA breach (`slaBreaches > 0`, the same RED-band threshold
 *     `SlaBadge.tsx` already uses) — a plain backlog count is informational,
 *     not a warning, so it stays a neutral navy pill until it actually is one.
 *
 * Dark theme (app/globals.css's `admin-dark:` custom variant, toggled by
 * AdminHeader.tsx) is layered on afterward — see `navLinkClass`/
 * `subNavLinkClass` below for why the ACTIVE state uses a neutral light
 * highlight in dark mode instead of navy: `bg-navy/8 text-navy` on the
 * already-dark `#1B1F26` surface is close to invisible (a dark fill on a
 * dark background), so dark mode substitutes a plain light highlight for
 * "this is the current page" rather than trying to force the light-mode
 * navy treatment to also work on dark. The semantic icon colors
 * (navy/teal/marigold) stay full-strength in both themes — they're larger,
 * higher-contrast strokes that read fine on a dark surface unmodified.
 */

// The unified moderation queues (docs/ADMIN-CONSOLE-PLAN.md §3/§4.2). The
// old per-kind links this sidebar used to carry are gone: /admin/jobs,
// /admin/seekers/verifications and /admin/reviews now redirect straight
// here, so listing them separately would have been two links to one screen.
//
// The kind/label/href list itself lives in ./adminQueueNav.ts, shared with
// AdminHeader.tsx's pending-items notification panel — REPORT was missing
// from this list entirely until it was added there (Phase 4's fifth queue
// kind never made it into this specific array), and a shared module is what
// keeps that from happening a second time in two places.
//
// /admin/companies is the exception and keeps its own entry below — the
// verification queue moved out of it, but its collaborative-hiring access
// tool did not move anywhere, so that path still leads somewhere distinct.

/**
 * Semantic icon color per nav item — Teal for employer/company-side content,
 * Marigold for seeker-side content, Navy for everything shared, structural,
 * or mixed (both sides participate, or it's platform-wide). Applied to the
 * icon element directly (overrides the inherited `currentColor` the way any
 * Tailwind text-color class does), independent of the active/inactive pill
 * styling below, which stays navy-on-active in light mode the way it always
 * has — the icon carries "what kind of thing is this", the pill carries "is
 * this the current page".
 */
const ICON_COLOR = {
  navy: "text-navy",
  teal: "text-teal",
  marigold: "text-marigold",
} as const;

type QueueHealthEntry = { kind: QueueKind; depth: number; slaBreaches: number };

const SIDEBAR_COLLAPSED_STORAGE_KEY = "eh-admin-sidebar-collapsed";
const SIDEBAR_WIDTH_EXPANDED = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "4rem";
const QUEUE_HEALTH_POLL_MS = 60_000;

/**
 * Full-row nav link styling (Dashboard, Company access, Users, Jobs, Trust
 * scores, Audit log, Health, Feature flags, Admin team, and the Queues
 * group header) — every one of those shares this exact active/inactive
 * shape, so it lives in one function instead of the same ternary retyped
 * nine times over.
 */
function navLinkClass(active: boolean): string {
  return active
    ? "bg-navy/8 text-navy admin-dark:bg-white/10 admin-dark:text-mist"
    : "text-ink/65 hover:bg-ink/4 hover:text-ink admin-dark:text-mist/65 admin-dark:hover:bg-white/8 admin-dark:hover:text-mist";
}

/** Same shape as `navLinkClass`, one step down in size/weight — the queue sub-items and the "Overview" link nested under the Queues group. */
function subNavLinkClass(active: boolean): string {
  return active
    ? "bg-navy/8 text-navy admin-dark:bg-white/10 admin-dark:text-mist"
    : "text-ink/55 hover:bg-ink/4 hover:text-ink admin-dark:text-mist/55 admin-dark:hover:bg-white/8 admin-dark:hover:text-mist";
}

/**
 * Deliberately plain primitives, not `ResolvedAdminAccess` — this file must
 * not import `/lib` (a client component would be pulling in server-only code
 * paths, and `ResolvedAdminAccess.permissions` is a `Set`, which doesn't
 * survive a Server -> Client Component prop boundary intact). The admin
 * layout converts the real resolved access into this shape once, server-side
 * (see app/admin/layout.tsx), and this component only ever reads from it.
 *
 * IMPORTANT: this is ergonomics, not the enforcement layer. Every page and
 * API route behind these links already gates itself server-side
 * (`requireAdminPagePermission` / the route's own permission check per
 * docs/ADMIN-CONSOLE-PLAN.md §8.1) — hiding a link here only stops a viewer
 * from being shown a door that would bounce them to `/admin/forbidden`
 * anyway. Getting this wrong makes the sidebar confusing, not insecure.
 *
 * `QueueKind` (imported above) is a plain TypeScript union, not a Prisma
 * runtime value, so importing its TYPE here does not violate the no-`/lib`
 * rule — nothing from lib/admin/queues.ts is imported as a VALUE.
 */
export type AdminSidebarAccess = {
  level: string;
  permissions: string[];
};

export type AdminSidebarProps = {
  access: AdminSidebarAccess;
};

/**
 * Small pending-count pill — navy by default, Ember only on a real SLA
 * breach. Renders nothing at depth 0: an empty queue is not something to
 * badge. The navy tone is bumped up in dark mode (`/10`→`/25` fill,
 * `text-navy`→`text-mist`) for the same reason the active nav state is —
 * a faint dark-navy fill and dark-navy text both lose to a dark surface.
 * Ember needs no dark-mode adjustment: it's already a solid, high-contrast
 * fill in light mode and stays exactly as legible on dark.
 */
function CountBadge({ depth, breached, collapsed }: { depth: number; breached: boolean; collapsed: boolean }) {
  if (depth <= 0) return null;
  const tone = breached ? "bg-ember text-white" : "bg-navy/10 text-navy admin-dark:bg-navy/30 admin-dark:text-mist";
  if (collapsed) {
    return (
      <span
        className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-data text-[9px] font-bold ${tone}`}
        aria-hidden="true"
      >
        {depth > 99 ? "99+" : depth}
      </span>
    );
  }
  return (
    <span className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 font-data text-[10px] font-bold ${tone}`}>
      {depth > 99 ? "99+" : depth}
    </span>
  );
}

export default function AdminSidebar({ access }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut, overlay } = useSignOut();
  const queuesActive = pathname.startsWith("/admin/queues");
  const [queuesOpen, setQueuesOpen] = useState(true);

  // Read localStorage after mount, not in a lazy useState initializer — a
  // client component's FIRST render still runs on the server (no
  // `localStorage`), so the initial value must be the same default on both
  // sides to avoid a hydration mismatch. `useLayoutEffect` (not `useEffect`)
  // so the collapsed width, if that's what was stored, applies before the
  // browser paints rather than flashing expanded-then-collapsed.
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    let stored = false;
    try {
      stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode, blocked site data) — stay expanded.
    }
    // Same intentional client-only hydration read as EmployerPageThemeProvider.tsx —
    // there is no way to know a browser-only preference during SSR, so this
    // one extra pre-paint render is the correct, standard fix, not something
    // to restructure around.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only hydration
    setCollapsed(stored);
    setHydrated(true);
  }, []);

  // Publish the width to the CSS var app/admin/layout.tsx's content column
  // reads, and persist the preference. Skipped until `hydrated` so this
  // doesn't immediately re-write the var the layout effect above just set
  // (both would agree anyway, but there's no reason to run it twice).
  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.style.setProperty(
      "--eh-sidebar-w",
      collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED
    );
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // Same as above — a failed write just means the preference doesn't persist.
    }
  }, [collapsed, hydrated]);

  // Reset the var on unmount so a sidebar-less page (there are none today,
  // but this is cheap insurance against a future one) never inherits a stale
  // width. Matches ImpersonationBanner.tsx's own cleanup discipline.
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty("--eh-sidebar-w");
    };
  }, []);

  const can = (permission: string) => access.permissions.includes(permission);
  const canDecideQueues = can("queue.decide");
  const canReadUsers = can("user.read");
  const canManageTeam = can("team.manage");
  const canReadSystem = can("system.read");
  const canReadAudit = can("audit.read");

  // Queue pending-count badges — polled, not a one-time fetch, since the
  // whole point is surfacing NEW pending items an admin hasn't seen yet
  // (app/admin/layout.tsx is a Server Component that only renders once per
  // hard navigation into /admin, so a server-fetched count would go stale
  // for the length of an admin's whole session). Re-fetched on every route
  // change too — the admin very likely just acted on a queue item, so
  // waiting up to a full poll interval to reflect that would be a visibly
  // stale badge right after the action that should have moved it.
  //
  // Same shape as CommandPalette.tsx's own fetch effect: the promise chain
  // is written directly in the effect body (not via a separately-called
  // helper function), with setState only ever happening inside `.then()` —
  // an async continuation, not a synchronous call in the effect body — and
  // any still-in-flight request from a previous pathname is cancelled via
  // the same AbortController-in-cleanup pattern, rather than a manual
  // in-flight boolean guard.
  const [health, setHealth] = useState<QueueHealthEntry[] | null>(null);

  useEffect(() => {
    if (!canDecideQueues) return;

    const controller = new AbortController();
    fetch("/api/admin/queues/health", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { health: QueueHealthEntry[] } | null) => {
        if (body) setHealth(body.health);
      })
      .catch((e) => {
        // Aborted by a superseding navigation, or a network failure — either
        // way a missed badge refresh is not worth surfacing as an error; the
        // queue screens themselves stay the source of truth.
        if (e instanceof DOMException && e.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [canDecideQueues, pathname]);

  useEffect(() => {
    if (!canDecideQueues) return;
    const id = window.setInterval(() => {
      fetch("/api/admin/queues/health", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((body: { health: QueueHealthEntry[] } | null) => {
          if (body) setHealth(body.health);
        })
        .catch(() => {});
    }, QUEUE_HEALTH_POLL_MS);
    return () => window.clearInterval(id);
  }, [canDecideQueues]);

  const healthByKind = new Map((health ?? []).map((h) => [h.kind, h]));
  const totalQueueDepth = (health ?? []).reduce((sum, h) => sum + h.depth, 0);
  const anyQueueBreach = (health ?? []).some((h) => h.slaBreaches > 0);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-ink/10 bg-white transition-[width] duration-200 ease-out admin-dark:border-white/10 admin-dark:bg-admin-dark-surface ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className={`flex shrink-0 items-center gap-1 px-4 py-6 ${collapsed ? "flex-col" : ""}`}>
        <Link
          href="/admin/dashboard"
          className={`flex min-w-0 flex-1 items-center gap-2.5 ${collapsed ? "justify-center px-0" : "px-3"}`}
          title="EasyHire Admin"
        >
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-navy" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            <div className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="block truncate font-display text-lg font-bold tracking-tight text-ink admin-dark:text-mist">
                EasyHire
              </span>
              {/* Navy-as-text (not as an icon or a pill fill) is what doesn't
                  survive the switch to a dark surface — a dark accent colour
                  used as small text on an already-dark background loses
                  contrast, unlike navy used as an icon stroke or a badge
                  fill, both of which stay legible unchanged. */}
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-navy/60 admin-dark:text-mist/45">
                Admin
              </span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 rounded-lg p-1.5 text-ink/35 hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:text-mist/40 admin-dark:hover:bg-white/8 admin-dark:hover:text-mist"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      <nav className={`flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden px-4 ${collapsed ? "items-center px-2" : ""}`}>
        <Link
          href="/admin/dashboard"
          title="Dashboard"
          className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
            collapsed ? "w-11 justify-center px-0" : "w-full px-3"
          } ${navLinkClass(pathname === "/admin/dashboard")}`}
        >
          <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
          {!collapsed && "Dashboard"}
        </Link>

        {canDecideQueues && (
          <div className={collapsed ? "" : "w-full"}>
            {collapsed ? (
              // No room for a flyout submenu in the icon rail — the group
              // becomes a direct link to the queue overview instead
              // (§4.2's own "Overview" sub-link target), same destination a
              // click on the expanded header's own row would reach via
              // /admin/queues.
              <Link
                href="/admin/queues"
                title={`Queues${totalQueueDepth > 0 ? ` — ${totalQueueDepth} pending` : ""}`}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${navLinkClass(queuesActive)}`}
              >
                <Layers className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
                <CountBadge depth={totalQueueDepth} breached={anyQueueBreach} collapsed />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setQueuesOpen((v) => !v)}
                  aria-expanded={queuesOpen}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${navLinkClass(queuesActive)}`}
                >
                  <Layers className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
                  <span className="flex-1 text-left">Queues</span>
                  <CountBadge depth={totalQueueDepth} breached={anyQueueBreach} collapsed={false} />
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-ink/40 transition-transform admin-dark:text-mist/35 ${queuesOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {queuesOpen && (
                  <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-ink/10 pl-3 admin-dark:border-white/10">
                    <Link
                      href="/admin/queues"
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${subNavLinkClass(pathname === "/admin/queues")}`}
                    >
                      Overview
                    </Link>
                    {queueItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const h = healthByKind.get(item.kind);
                      const Icon = QUEUE_KIND_ICON[item.kind];
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${subNavLinkClass(isActive)}`}
                        >
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${QUEUE_ICON_COLOR[item.kind]}`} strokeWidth={2} aria-hidden="true" />
                          <span className="flex-1">{item.label}</span>
                          {h && <CountBadge depth={h.depth} breached={h.slaBreaches > 0} collapsed={false} />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {canDecideQueues && (
          <Link
            href="/admin/companies"
            title="Company access"
            className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
              collapsed ? "w-11 justify-center px-0" : "w-full px-3"
            } ${navLinkClass(pathname === "/admin/companies")}`}
          >
            <Building2 className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.teal}`} strokeWidth={2} />
            {!collapsed && "Company access"}
          </Link>
        )}

        {/* Directory group (docs/ADMIN-CONSOLE-PLAN.md §3, Phase 2): all
            users/jobs, any role/status, distinct from the moderation queues
            above. No standalone "Companies" directory link yet — reach a
            company via a user's 360 record, the job directory, or ⌘K. */}
        {(canReadUsers || canDecideQueues) && (
          <p
            className={`mt-3 text-[10px] font-bold uppercase tracking-wider text-ink/35 admin-dark:text-mist/30 ${
              collapsed ? "w-11 border-t border-ink/10 pt-3 text-center admin-dark:border-white/10" : "px-3"
            }`}
          >
            {collapsed ? "" : "Directory"}
          </p>
        )}
        {canReadUsers && (
          <Link
            href="/admin/users"
            title="Users"
            className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
              collapsed ? "w-11 justify-center px-0" : "w-full px-3"
            } ${navLinkClass(pathname === "/admin/users" || pathname.startsWith("/admin/users/"))}`}
          >
            <Users className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
            {!collapsed && "Users"}
          </Link>
        )}
        {canDecideQueues && (
          <Link
            href="/admin/jobs/directory"
            title="Jobs"
            className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
              collapsed ? "w-11 justify-center px-0" : "w-full px-3"
            } ${navLinkClass(pathname === "/admin/jobs/directory")}`}
          >
            <Briefcase className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.teal}`} strokeWidth={2} />
            {!collapsed && "Jobs"}
          </Link>
        )}

        {/* Trust group (docs/ADMIN-CONSOLE-PLAN.md §3/§4.8/§4.9, Phase 4):
            risk-ranked trust scores and the immutable admin audit log. Two
            separate permissions (`user.read` for trust, `audit.read` for the
            audit log) — an admin can hold either without the other. */}
        {(canReadUsers || canReadAudit) && (
          <p
            className={`mt-3 text-[10px] font-bold uppercase tracking-wider text-ink/35 admin-dark:text-mist/30 ${
              collapsed ? "w-11 border-t border-ink/10 pt-3 text-center admin-dark:border-white/10" : "px-3"
            }`}
          >
            {collapsed ? "" : "Trust"}
          </p>
        )}
        {canReadUsers && (
          <Link
            href="/admin/trust"
            title="Trust scores"
            className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
              collapsed ? "w-11 justify-center px-0" : "w-full px-3"
            } ${navLinkClass(pathname === "/admin/trust")}`}
          >
            <ShieldAlert className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
            {!collapsed && "Trust scores"}
          </Link>
        )}
        {canReadAudit && (
          <Link
            href="/admin/audit"
            title="Audit log"
            className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
              collapsed ? "w-11 justify-center px-0" : "w-full px-3"
            } ${navLinkClass(pathname === "/admin/audit")}`}
          >
            <ScrollText className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
            {!collapsed && "Audit log"}
          </Link>
        )}

        {(canReadSystem || canManageTeam) && (
          <>
            <p
              className={`mt-3 text-[10px] font-bold uppercase tracking-wider text-ink/35 admin-dark:text-mist/30 ${
                collapsed ? "w-11 border-t border-ink/10 pt-3 text-center admin-dark:border-white/10" : "px-3"
              }`}
            >
              {collapsed ? "" : "System"}
            </p>
            {canReadSystem && (
              <Link
                href="/admin/system"
                title="Health"
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  collapsed ? "w-11 justify-center px-0" : "w-full px-3"
                } ${navLinkClass(pathname === "/admin/system")}`}
              >
                <Activity className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
                {!collapsed && "Health"}
              </Link>
            )}
            {canReadSystem && (
              <Link
                href="/admin/system/flags"
                title="Feature flags"
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  collapsed ? "w-11 justify-center px-0" : "w-full px-3"
                } ${navLinkClass(pathname === "/admin/system/flags")}`}
              >
                <Flag className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
                {!collapsed && "Feature flags"}
              </Link>
            )}
            {canManageTeam && (
              <Link
                href="/admin/system/team"
                title="Admin team"
                className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  collapsed ? "w-11 justify-center px-0" : "w-full px-3"
                } ${navLinkClass(pathname === "/admin/system/team")}`}
              >
                <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${ICON_COLOR.navy}`} strokeWidth={2} />
                {!collapsed && "Admin team"}
              </Link>
            )}
          </>
        )}
      </nav>

      <div className={`shrink-0 border-t border-ink/5 py-4 admin-dark:border-white/8 ${collapsed ? "px-2" : "px-4"}`}>
        <button
          type="button"
          onClick={signOut}
          title="Log out"
          className={`flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-ink/60 hover:bg-ember/5 hover:text-ember admin-dark:text-mist/55 admin-dark:hover:bg-ember/15 ${
            collapsed ? "w-11 justify-center px-0" : "w-full px-3"
          }`}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
          {!collapsed && "Log out"}
        </button>
      </div>
      {overlay}
    </aside>
  );
}
