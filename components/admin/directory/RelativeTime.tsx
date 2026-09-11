"use client";

import { useCallback, useSyncExternalStore } from "react";
import { formatDateTime } from "./badges";

/**
 * "N minutes/hours/days ago" text.
 *
 * The clock is an external, mutable data source, so it is read through
 * `useSyncExternalStore` — React's sanctioned primitive for exactly that —
 * rather than through `useState` + `useEffect`. The effect version is the
 * obvious one and it is wrong twice over: it calls `setState` synchronously
 * in the effect body (`react-hooks/set-state-in-effect`, a hard error in this
 * repo), and it renders one throwaway frame before the real value appears.
 *
 * `getServerSnapshot` returns null so the server and the client's first paint
 * agree byte-for-byte on the absolute timestamp — a relative string computed
 * on both sides can land in different seconds and cause a hydration mismatch.
 * `title` always carries the absolute timestamp, so the exact time is never
 * lost to rounding.
 */

/** The clock has no change events, so "subscribe" is a one-minute tick. */
function subscribe(onStoreChange: () => void): () => void {
  const id = setInterval(onStoreChange, 60_000);
  return () => clearInterval(id);
}

function relativeFrom(thenMs: number, nowMs: number): string {
  const minutes = Math.round((nowMs - thenMs) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

export default function RelativeTime({ iso, fallback = "Never" }: { iso: string | null; fallback?: string }) {
  // Returns a plain string, so React's `Object.is` snapshot comparison is
  // stable between ticks: "5m ago" === "5m ago" and no re-render is scheduled
  // until the label actually changes.
  const getSnapshot = useCallback((): string | null => {
    if (!iso) return null;
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return null;
    return relativeFrom(then, Date.now());
  }, [iso]);

  const getServerSnapshot = useCallback((): string | null => null, []);

  const relative = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!iso) return <span>{fallback}</span>;

  return <span title={formatDateTime(iso)}>{relative ?? formatDateTime(iso)}</span>;
}
