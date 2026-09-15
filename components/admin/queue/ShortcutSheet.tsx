"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { useDialogFocusTrap } from "@/components/admin/useDialogFocusTrap";

/**
 * The `?` shortcut overlay (docs/ADMIN-CONSOLE-PLAN.md §4.2: "`?` shortcut
 * sheet"). A lightweight modal: focus moves in on open, Escape and the
 * labelled close button both dismiss, focus returns to whatever triggered it.
 *
 * Conditionally mounted by the parent (`{shortcutSheetOpen && <ShortcutSheet ... />}`
 * in `ReviewQueue.tsx`), same convention as every other dialog in this tree —
 * mounting IS opening, so `useDialogFocusTrap`'s mount-once effect fires
 * correctly on every open, not just the first. This used to stay always-mounted
 * with an internal `open` prop instead, which needed its own hand-rolled
 * focus-trap effect (re-running on the `open`/`onClose` deps rather than on
 * mount) to work at all — docs/ADMIN-UI-UPGRADE.md §2.1.
 */

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "j / k", description: "Move selection down / up the queue" },
  { keys: "a", description: "Approve (or restore) the selected item" },
  { keys: "r", description: "Reject (or hide) — focuses the reason field" },
  { keys: "Enter", description: "Commit the currently open decision" },
  { keys: "?", description: "Toggle this shortcut sheet" },
  { keys: "Escape", description: "Close this sheet or any open dialog" },
];

export default function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

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
