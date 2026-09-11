"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * The `?` shortcut overlay (docs/ADMIN-CONSOLE-PLAN.md §4.2: "`?` shortcut
 * sheet"). A lightweight modal: focus moves in on open, Escape and the
 * labelled close button both dismiss, focus returns to whatever triggered it.
 */

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "j / k", description: "Move selection down / up the queue" },
  { keys: "a", description: "Approve (or restore) the selected item" },
  { keys: "r", description: "Reject (or hide) — focuses the reason field" },
  { keys: "Enter", description: "Commit the currently open decision" },
  { keys: "?", description: "Toggle this shortcut sheet" },
  { keys: "Escape", description: "Close this sheet or any open dialog" },
];

export default function ShortcutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    triggerElementRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        // Only one focusable element (the close button) — keep focus pinned
        // inside the dialog instead of letting Tab escape to the page.
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-sheet-title"
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="shortcut-sheet-title" className="font-display text-lg font-bold text-ink">
            Keyboard shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="rounded-lg p-1.5 text-ink/50 hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <dl className="space-y-2.5">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4 text-sm">
              <dt>
                <kbd className="rounded-md border border-ink/15 bg-mist px-2 py-1 font-data text-xs font-semibold text-ink/80">
                  {s.keys}
                </kbd>
              </dt>
              <dd className="text-right text-ink/65">{s.description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-ink/40">Shortcuts are disabled while typing in a text field.</p>
      </div>
    </div>
  );
}
