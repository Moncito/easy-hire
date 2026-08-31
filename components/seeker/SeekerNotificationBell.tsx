"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { notificationHref } from "@/lib/notifications";
import { listSeekerNotifications, markSeekerNotificationsRead } from "@/lib/client/notifications";

type Notification = {
  id: string;
  type: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
};

type Variant = "dark" | "light";
type Size = "sm" | "md";

type Props = {
  /**
   * "dark" sits on the glass Harbor-Navy pill nav (SeekerPillNav); "light"
   * sits on white chrome (SeekerSidebar, SeekerMobileBottomNav).
   */
  variant?: Variant;
  /** Which way the dropdown opens relative to the trigger. */
  dropDirection?: "down" | "up";
  /** Horizontal alignment of the dropdown relative to the trigger. */
  align?: "left" | "right";
  /**
   * "md" (default) is the original size, used by SeekerSidebar and
   * SeekerMobileBottomNav — do not change their rendering. "sm" matches the
   * 32px / 14px-icon footprint of the SeekerPillNav nav buttons, for use
   * only when the bell sits beside that nav.
   */
  size?: Size;
};

const sizeStyles: Record<Size, { button: string; icon: string; badge: string; badgePosition: string }> = {
  md: {
    button: "h-9 w-9",
    icon: "h-5 w-5",
    badge: "h-4 min-w-4 px-1 text-[9px]",
    badgePosition: "right-0.5 top-0.5",
  },
  sm: {
    button: "h-8 w-8",
    icon: "h-3.5 w-3.5",
    badge: "h-3.5 min-w-3.5 px-0.5 text-[8px]",
    badgePosition: "right-0 top-0",
  },
};

/**
 * Notification bell for the seeker chrome. Modeled on
 * components/employer/EmployerNotificationBell.tsx for interaction parity
 * (poll every 60s, click-outside to close, optimistic mark-all-read), with
 * accessibility additions the employer bell doesn't have yet: aria-expanded/
 * aria-haspopup/aria-controls on the trigger, Escape-to-close with focus
 * returned to the trigger, an aria-live region announcing load/mark-read
 * results, and an unread indicator that doesn't rely on colour alone.
 *
 * No pagination: the backend supports cursor pagination (`nextCursor`), but
 * the employer bell this is modeled on doesn't page its dropdown either —
 * kept simple to match that interaction model. A dedicated seeker
 * notifications page would be the natural place for "load more".
 */
export default function SeekerNotificationBell({
  variant = "light",
  dropDirection = "down",
  align = "right",
  size = "md",
}: Props) {
  const s = sizeStyles[size];
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      listSeekerNotifications()
        .then((data) => {
          if (cancelled || !data) return;
          const nextUnread = data.unreadCount ?? 0;
          setNotifications(data.notifications ?? []);
          setUnreadCount(nextUnread);
          setStatusMessage(
            nextUnread > 0
              ? `${nextUnread} unread notification${nextUnread === 1 ? "" : "s"}`
              : ""
          );
        })
        .catch(() => {
          /* ignore — next poll will retry */
        });
    };

    run();
    const interval = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
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

  function toggleOpen() {
    setOpen((v) => !v);
  }

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

  const triggerClass =
    variant === "dark"
      ? "text-mist/75 hover:bg-white/10 hover:text-white"
      : "text-ink/55 hover:bg-ink/[0.04] hover:text-ink";

  const panelPositionClass = [
    dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2",
    align === "left" ? "left-0" : "right-0",
  ].join(" ");

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Persistent live region — announces load results and mark-read
          outcomes regardless of whether the dropdown is open. */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <button
        type="button"
        ref={triggerRef}
        onClick={toggleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        className={`relative flex ${s.button} shrink-0 items-center justify-center rounded-full transition ${triggerClass}`}
      >
        <Bell className={s.icon} strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={`absolute ${s.badgePosition} flex ${s.badge} items-center justify-center rounded-full bg-marigold font-bold text-ink`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          role="region"
          aria-label="Notifications"
          tabIndex={-1}
          className={`absolute z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xl outline-none ${panelPositionClass}`}
        >
          <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
            <p className="font-display text-sm font-bold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-navy hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink/40">No notifications yet</p>
            ) : (
              notifications.map((n) => {
                const href = notificationHref(n.type, "SEEKER") ?? "/seeker/dashboard";
                const unread = !n.readStatus;
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-start gap-2 border-b border-ink/5 px-4 py-3 text-sm transition hover:bg-ink/[0.02] ${
                      unread ? "bg-marigold/[0.07]" : ""
                    }`}
                  >
                    {unread && (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold"
                      />
                    )}
                    <span className="flex-1">
                      <p className={`leading-snug ${unread ? "font-semibold text-ink" : "text-ink/80"}`}>
                        {n.message}
                        {unread && <span className="sr-only"> (unread)</span>}
                      </p>
                      <p className="mt-1 text-[10px] text-ink/35">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
