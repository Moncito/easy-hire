"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { notificationHref } from "@/lib/notifications";
import { listSeekerNotifications, markSeekerNotificationsRead } from "@/lib/client/notifications";

type Notification = {
  id: string;
  type: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
};

function formatTimestamp(createdAt: string) {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Full, paginated notification list for /seeker/notifications — the "view
 * all" destination linked from SeekerNotificationBell. Reuses the bell's own
 * request shape (lib/client/notifications) rather than a bespoke fetch, so
 * the two surfaces can never drift on what a notification payload looks
 * like.
 */
export default function SeekerNotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    listSeekerNotifications()
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setLoadError(true);
          return;
        }
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setStatusMessage("Loading more notifications…");
    try {
      const data = await listSeekerNotifications({ cursor: nextCursor });
      if (!data) throw new Error("Failed to load more notifications");
      setNotifications((prev) => [...prev, ...(data.notifications ?? [])]);
      setNextCursor(data.nextCursor ?? null);
      setUnreadCount(data.unreadCount ?? 0);
      setStatusMessage(
        data.notifications?.length
          ? `Loaded ${data.notifications.length} more notification${data.notifications.length === 1 ? "" : "s"}.`
          : "No more notifications."
      );
    } catch {
      setStatusMessage("Couldn't load more notifications. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  async function markAllRead() {
    setStatusMessage("Marking all notifications as read…");
    try {
      await markSeekerNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
      setStatusMessage("All notifications marked as read.");
    } catch {
      setStatusMessage("Couldn't mark notifications as read. Please try again.");
    }
  }

  function handleItemClick(n: Notification) {
    if (n.readStatus) return;
    setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, readStatus: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
    markSeekerNotificationsRead([n.id]).catch(() => {
      /* best-effort — worst case the item shows read locally until refresh */
    });
  }

  return (
    <div className="space-y-6">
      {/* Persistent live region — announces load-more and mark-read outcomes
          to screen readers, mirroring SeekerNotificationBell's own pattern. */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="animate-fade-in flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Notifications</h1>
          <p className="mt-1.5 text-sm text-ink/50">Everything that&apos;s happened on your account.</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="mt-1 cursor-pointer text-xs font-semibold text-navy hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink/30" aria-hidden="true" />
          <span className="sr-only">Loading notifications…</span>
        </div>
      ) : loadError ? (
        <p className="py-16 text-center text-sm text-ink/45">
          Couldn&apos;t load notifications. Try refreshing the page.
        </p>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center animate-slide-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.04]">
            <Bell className="h-8 w-8 text-ink/20" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-lg font-bold text-ink">No notifications yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/50">
            Application updates, messages, and interview requests will show up here.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink/8 animate-slide-up">
            {notifications.map((n) => {
              const href = notificationHref(n.type, "SEEKER") ?? "/seeker/dashboard";
              const unread = !n.readStatus;
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    onClick={() => handleItemClick(n)}
                    className={`flex items-start gap-4 py-4 transition-colors hover:bg-ink/[0.02] ${
                      unread ? "bg-marigold/[0.06]" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marigold/12">
                      <Bell className="h-4 w-4 text-marigold" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${unread ? "font-semibold text-ink" : "text-ink/75"}`}>
                        {n.message}
                        {unread && <span className="sr-only"> (unread)</span>}
                      </p>
                      <p className="mt-1 text-xs text-ink/40">{formatTimestamp(n.createdAt)}</p>
                    </div>
                    {unread && (
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink/60 transition hover:border-navy/30 hover:text-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
