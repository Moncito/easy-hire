"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Shared focus-trap hook — same behaviour as the inline copies in
 * `components/admin/team/AdminProfileEditor.tsx` and
 * `CreateAdminProfileForm.tsx` (focuses the first focusable element on open,
 * cycles Tab/Shift+Tab within the dialog, Escape cancels, restores focus to
 * the trigger on close). Extracted here rather than duplicated a third and
 * fourth time for the feature-flags dialogs in `components/admin/flags/`.
 */
export function useDialogFocusTrap(dialogRef: RefObject<HTMLDivElement | null>, onCancel: () => void) {
  useEffect(() => {
    const triggerElement = document.activeElement;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (triggerElement instanceof HTMLElement) triggerElement.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
