"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, RefreshCcw } from "lucide-react";
import { PLATFORM_EVENT_TYPES } from "@/lib/admin/events";
import { fetchUserActivityPage } from "./api";
import { formatDateTime, titleCaseFromConstant } from "./badges";
import type { PlatformEventType, SerializedPlatformEvent } from "./types";

/**
 * Activity timeline — docs/ADMIN-CONSOLE-PLAN.md §4.3: "every movement,
 * reverse-chronological, filterable by type, infinite scroll." Backed by
 * `GET /api/admin/users/[id]/activity`, which is itself a thin wrapper over
 * `listEventsForUser` (lib/admin/events.ts) — cursor-paginated on
 * (createdAt, id), never OFFSET.
 *
 * Infinite scroll uses an `IntersectionObserver` on a bottom sentinel rather
 * than a scroll listener — cheaper, and it naturally does nothing once
 * `nextCursor` is null (the sentinel is simply never rendered).
 */

const EVENT_TYPE_OPTIONS: { value: PlatformEventType | ""; label: string }[] = [
  { value: "", label: "All activity" },
  ...PLATFORM_EVENT_TYPES.map((t) => ({ value: t, label: titleCaseFromConstant(t) })),
];

export default function ActivityTimeline({ userId, initialEvents, initialNextCursor }: {
  userId: string;
  initialEvents: SerializedPlatformEvent[];
  initialNextCursor: string | null;
}) {
  const [eventType, setEventType] = useState<PlatformEventType | "">("");
  const [events, setEvents] = useState<SerializedPlatformEvent[]>(initialEvents);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(initialNextCursor);
  const didMountRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  async function loadPage(reset: boolean) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchUserActivityPage(
        userId,
        { eventType: eventType || undefined, cursor: reset ? undefined : nextCursorRef.current, limit: 50 },
        controller.signal
      );
      setEvents((prev) => (reset ? res.events : [...prev, ...res.events]));
      setNextCursor(res.nextCursor);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load activity.");
    } finally {
      setLoading(false);
    }
  }

  // Filter change -> refetch from the top. Skips the first render, which
  // already has the server-rendered first page.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType]);

  // Infinite scroll — observe a sentinel below the list; load more when it
  // enters the viewport, provided there's a next page and nothing in flight.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading) {
          void loadPage(false);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor, loading]);

  return (
    <section aria-labelledby="activity-timeline-heading" className="rounded-2xl border border-ink/5 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-timeline-heading" className="font-display text-lg font-bold text-ink">
          Activity
        </h2>
        <label htmlFor="activity-type-filter" className="sr-only">
          Filter activity by type
        </label>
        <select
          id="activity-type-filter"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as PlatformEventType | "")}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink/70 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        >
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-ember/20 bg-ember/5 py-10 text-center">
          <p className="text-sm text-ember">{error}</p>
          <button
            type="button"
            onClick={() => void loadPage(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ember/30 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/10"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : events.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-ink/5 bg-mist/40 py-12 text-center">
          <Activity className="h-6 w-6 text-ink/30" aria-hidden="true" />
          <p className="font-display text-base font-bold text-ink">
            {eventType ? "No activity of this type" : "No activity recorded"}
          </p>
          <p className="max-w-xs text-sm text-ink/50">
            {eventType ? "Try a different event type." : "Movements are recorded going forward — nothing has landed for this account yet."}
          </p>
        </div>
      ) : (
        <ol className="max-h-[32rem] space-y-1 overflow-y-auto pr-1" aria-live="polite">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm odd:bg-mist/40"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{titleCaseFromConstant(event.eventType)}</p>
                <p className="truncate text-xs text-ink/45">
                  {event.actorType}
                  {event.entityType && (
                    <>
                      {" "}
                      · <span className="font-data">{event.entityType.toLowerCase()}</span>
                      {event.entityId && <span className="font-data"> #{event.entityId.slice(0, 8)}</span>}
                    </>
                  )}
                </p>
              </div>
              <time dateTime={event.createdAt} className="shrink-0 font-data text-xs text-ink/50">
                {formatDateTime(event.createdAt)}
              </time>
            </li>
          ))}
          {nextCursor && (
            <li ref={sentinelRef} className="py-2 text-center text-xs text-ink/35">
              {loading ? "Loading more…" : ""}
            </li>
          )}
        </ol>
      )}
    </section>
  );
}
