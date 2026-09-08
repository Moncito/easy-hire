"use client";

import { useEffect, useRef } from "react";

/**
 * Shared open/close plumbing for the small dropdown menus in the saved-jobs
 * folder UI (add-to-folder, folder management, new-folder popovers):
 * click-outside closes, Escape closes and returns focus to the trigger.
 * Modeled on components/seeker/SeekerNotificationBell.tsx, which is the
 * repo's existing precedent for this exact interaction.
 */
export function useDismissMenu(open: boolean, onClose: () => void) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return { wrapperRef, triggerRef };
}
