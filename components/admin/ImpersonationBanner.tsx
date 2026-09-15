"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * The persistent "which hat am I wearing" banner — docs/ADMIN-CONSOLE-PLAN.md
 * §8.2. Mounted by `app/seeker/layout.tsx` / `app/employer/layout.tsx`
 * whenever `requireSeekerLayoutContext`/`requireEmployerLayoutContext` (both
 * in /lib, read-only from here) resolve an `impersonation` field on the
 * layout context. Renders nothing otherwise — the common case must get zero
 * extra DOM, zero extra network, zero visual weight.
 *
 * LAYOUT CONTRACT: this is `position: fixed`, always on top (z-[100], above
 * every other fixed/sticky piece of chrome in either shell — the seeker
 * pill-nav header is z-50, the employer sidebar z-40, its topbar z-30, its
 * route-progress hairline z-60, the seeker workspace switcher z-60). Being
 * fixed rather than merely `sticky` is what "impossible to miss, cannot
 * scroll away" actually requires — a `sticky` element is still just as
 * pinned in *this* layout, but `fixed` needs no assumptions about which
 * ancestor ends up being the scrolling container in either shell.
 *
 * Because this sits ABOVE the existing chrome rather than inside it, every
 * fixed/viewport-anchored piece of that chrome (SeekerPillNav,
 * SeekerWorkspaceSwitcher, EmployerShell's outer frame, its Sidebar, its
 * EmployerRouteProgress hairline) must shift down by exactly this banner's
 * height, or this banner would render on top of — i.e. visually swallow —
 * the first `offsetHeight` px of whichever one starts at the real viewport
 * top. Rather than hand each of those a hardcoded guess (this banner's text
 * wraps to two lines under ~400px, so a fixed guess would either clip the
 * second line or leave a dead gap), this component measures its own
 * rendered height and publishes it as `--eh-impersonation-h` on
 * `document.documentElement` (declared with a `0px` default in
 * app/globals.css, so every consumer is a no-op when this banner isn't
 * mounted). Every consumer reads that one variable; this is the only place
 * that writes it.
 */

export type ImpersonationBannerProps = {
  targetDisplayName: string;
  /** ISO string, not a `Date` — the layout serializes `impersonation.expiresAt` once so this stays a plain, unambiguous client prop. */
  expiresAt: string;
};

const CSS_VAR = "--eh-impersonation-h";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ImpersonationBanner({ targetDisplayName, expiresAt }: ImpersonationBannerProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  // Derived from a prop, so it is `useMemo`, not `useRef`. A ref read during
  // render is a React violation (`react-hooks/refs`), and it would also have
  // been silently wrong: a ref initialiser runs once for the lifetime of the
  // component, so a NEW `expiresAt` arriving on a re-render — a fresh session
  // started while this banner is still mounted — would have kept counting
  // down to the OLD session's expiry.
  const expiresAtMs = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const endedOnExpiryRef = useRef(false);

  const [now, setNow] = useState<number>(() => Date.now());
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  const remainingMs = expiresAtMs - now;
  const expired = remainingMs <= 0;

  // Tick every second while the session is still live. Stopped once expired
  // — there is nothing left to count down, and the interval would just spin
  // forever for no visible effect.
  useEffect(() => {
    if (expired) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expired]);

  // Publish this banner's real rendered height so the fixed/sticky chrome in
  // both shells can shift down by exactly that amount — see the module doc
  // comment above. `useLayoutEffect` (same convention as SeekerPillNav's own
  // width measurement) rather than `useEffect`, so the variable is set
  // before the browser paints — otherwise the nav chrome would render one
  // frame at its un-offset position and visibly jump down. A
  // ResizeObserver (not a one-time measurement) because the message wraps
  // onto a second line at narrow widths, which changes the height after
  // mount/on resize, not just once.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty(CSS_VAR, `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(CSS_VAR);
    };
  }, []);

  // The TTL is enforced server-side regardless of anything the client does
  // (resolveActiveImpersonation re-checks `expiresAt` against the DB on
  // every read) — this call is a courtesy, not a gate. Firing it once, the
  // moment the client-side countdown crosses zero, closes out the
  // `ImpersonationSession` row (`endedAt`) and its audit trail immediately
  // instead of leaving it to look merely "expired" until some later request
  // happens to touch it. Fire-and-forget: the UI already treats the session
  // as over either way.
  useEffect(() => {
    if (expired && !endedOnExpiryRef.current) {
      endedOnExpiryRef.current = true;
      void fetch("/api/admin/impersonation", { method: "DELETE" }).catch(() => {});
    }
  }, [expired]);

  async function handleEndSession() {
    setEndError(null);
    setEnding(true);
    try {
      const res = await fetch("/api/admin/impersonation", { method: "DELETE" });
      if (!res.ok) {
        setEnding(false);
        setEndError("Could not end the session. Please try again.");
        return;
      }
      router.push("/admin");
    } catch {
      setEnding(false);
      setEndError("Could not end the session — check your connection and try again.");
    }
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-0 top-0 z-[100] flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-ember px-3 py-2 text-white shadow-[0_2px_12px_rgba(0,0,0,0.18)] sm:px-4"
    >
      {/*
        This is a persistent STATE, not a one-off alert, so `role="status"`
        with `aria-live="polite"` is the right pairing (not `role="alert"` /
        `assertive`, which would interrupt whatever the admin is doing every
        time it re-renders): it announces the read-only/who-you're-viewing
        message once on mount, and again on the one state change that
        actually matters — active flipping to "Session expired". The
        second-by-second countdown below is deliberately OUTSIDE this live
        region (`aria-hidden`) — re-announcing "59:58… 59:57… 59:56…" to a
        screen-reader user every second would be unusable noise, and the one
        fact they need (the session ending) is already covered by this
        region's text changing when `expired` flips.
      */}
      <div role="status" aria-live="polite" className="flex min-w-0 flex-1 items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 truncate text-sm font-semibold">
          {expired ? (
            <>Session expired — you are no longer viewing {targetDisplayName}&rsquo;s account.</>
          ) : (
            <>
              Read-only admin view — viewing as <span className="font-bold">{targetDisplayName}</span>
            </>
          )}
        </span>
      </div>

      {!expired && (
        <span
          aria-hidden="true"
          title="Time remaining before this session expires automatically"
          className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 font-data text-xs tabular-nums"
        >
          {formatRemaining(remainingMs)} left
        </span>
      )}

      {endError && (
        <span role="alert" className="w-full text-xs font-medium text-white sm:w-auto">
          {endError}
        </span>
      )}

      {expired ? (
        <Link
          href="/admin"
          className="shrink-0 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember"
        >
          Return to admin console
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => void handleEndSession()}
          disabled={ending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ember"
        >
          {ending && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          End session
        </button>
      )}
    </div>
  );
}
