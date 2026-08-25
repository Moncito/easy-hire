"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { parseJsonBody } from "@/lib/client/fetch-json";

type Notification = {
  id: string;
  type: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
};

/**
 * Local href map for the collaborative workspace — the shared
 * lib/notifications.ts `notificationHref()` hardcodes /employer/* paths, so
 * this component keeps its own mapping into the current company's
 * /hiring/{companyId}/* routes instead.
 */
function hrefForNotification(companyId: string, type: string): string {
  switch (type) {
    case "NEW_APPLICATION":
    case "APPLICATION_WITHDRAWN":
    case "APPLICATION_REJECTED":
    case "SCORECARD_SUBMITTED":
    case "JOB_APPROVED":
    case "JOB_REJECTED":
      return `/hiring/${companyId}/queue`;
    case "NEW_MESSAGE":
      return `/hiring/${companyId}/messages`;
    case "COMPANY_APPROVED":
    case "COMPANY_REJECTED":
      return `/hiring/${companyId}/company-profile`;
    default:
      return `/hiring/${companyId}/notifications`;
  }
}

export default function WorkspaceNotificationBell({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/hiring/notifications");
      if (!res.ok) return;
      const data = (await parseJsonBody(res)) as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    try {
      await fetch("/api/hiring/notifications", { method: "PATCH" });
    } catch {
      /* ignore — optimistic update already applied */
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer rounded-lg p-2 text-ink/55 transition hover:bg-ink/[0.04] hover:text-ink"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
            <p className="text-sm font-bold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="cursor-pointer text-xs font-semibold text-teal hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink/40">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={hrefForNotification(companyId, n.type)}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-ink/5 px-4 py-3 text-sm transition hover:bg-ink/[0.02] ${
                    !n.readStatus ? "bg-teal/[0.03]" : ""
                  }`}
                >
                  <p className="leading-snug text-ink/80">{n.message}</p>
                  <p className="mt-1 text-[10px] text-ink/35">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Link>
              ))
            )}
          </div>
          <Link
            href={`/hiring/${companyId}/notifications`}
            onClick={() => setOpen(false)}
            className="block border-t border-ink/5 px-4 py-2.5 text-center text-xs font-semibold text-ink/50 transition hover:bg-ink/[0.02] hover:text-ink"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
