"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Admin-console custom select — a "select-only combobox" (ARIA APG term for
 * a combobox with no free-text editing, just a trigger + listbox), built to
 * replace the plain native `<select>`s the reject-confirm dialogs
 * (`components/admin/queue/DecisionForm.tsx`'s `RejectConfirmModal`,
 * `components/admin/queue/BulkBar.tsx`'s `TypedConfirmDialog`) were using for
 * their "Reason code" field. Not a general-purpose dropdown — deliberately
 * scoped to "pick exactly one option from a short list."
 *
 * Interaction model is the same ARIA combobox pattern already proven out in
 * `components/admin/CommandPalette.tsx` (role="combobox", aria-expanded,
 * aria-controls, aria-activedescendant, a role="listbox" panel of
 * role="option" buttons, arrow-key navigation, Enter commits, Escape closes),
 * scaled down: CommandPalette's combobox role lives on a text `<input>`
 * because it supports typing a query; this one has no text entry, so the
 * combobox role lives on the trigger `<button>` itself instead (the
 * "select-only" variant of the same APG pattern) and real DOM focus never
 * leaves that button — options are never natively focused, only virtually
 * highlighted via `aria-activedescendant`, exactly like CommandPalette's
 * result rows (`tabIndex={-1}` on every option).
 *
 * Positioning is a plain `absolute` panel under the trigger, not a portal —
 * matching CommandPalette's own listbox, which this codebase doesn't reach
 * for portals for.
 *
 * Closing behaviour is intentionally NOT built on `useDialogFocusTrap`. Both
 * current call sites already live inside a dialog that owns one
 * (`RejectConfirmModal` / `TypedConfirmDialog`), and that hook's Tab-trap
 * query (`'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'`)
 * matches on bare `button` regardless of `tabIndex`, so stacking a second
 * full trap here would only add a second competing Tab-cycle and inflate the
 * outer trap's "focusable" set with this listbox's own `tabIndex={-1}`
 * option buttons for no benefit — a lighter outside-click-only close plus
 * local Escape handling is all a popover like this needs; DOM focus never
 * moves into the panel in the first place, so there is nothing to trap.
 *
 * Escape while the panel is OPEN must close only the panel, not the parent
 * dialog, in the same keystroke. `useDialogFocusTrap` listens on `document`
 * with `capture: true`, registered when the surrounding modal mounts.
 * React's own delegated event listener for `keydown` is registered on the
 * hydration root (effectively `document` for this app's App Router) once,
 * at startup — before any modal ever mounts and adds its own ad-hoc
 * `document` listener. Because same-target listeners run in registration
 * order, React's dispatch (and therefore this component's own `onKeyDown`,
 * synthetic though it is) always completes before that later-added modal
 * listener fires, so calling `e.stopPropagation()` here on Escape reliably
 * suppresses the modal's own Escape handler for that keystroke — the modal
 * only sees a "bare" Escape once the panel is already closed. No portal,
 * capture-phase trick, or edit to `useDialogFocusTrap` needed.
 */

export type SelectOption = { value: string; label: string };

export type AdminSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** e.g. "Select a reason…" — shown, muted, when nothing is selected yet. */
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
  required?: boolean;
};

const AdminSelect = forwardRef<HTMLButtonElement, AdminSelectProps>(function AdminSelect(
  { id, value, onChange, options, placeholder = "Select…", disabled, "aria-label": ariaLabel, required },
  forwardedRef
) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Exposes the trigger button's DOM node to callers, e.g.
  // DecisionForm.tsx's `reasonSelectRef.current?.focus()` — same shape a
  // real `<select ref={...}>` gave them, just typed as a button now.
  useImperativeHandle(forwardedRef, () => triggerRef.current as HTMLButtonElement);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  function openList() {
    if (disabled || options.length === 0) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
  }

  function selectIndex(index: number) {
    const opt = options[index];
    if (!opt) return;
    onChange(opt.value);
    closeList();
    triggerRef.current?.focus();
  }

  // Outside-click close — no focus trap, see doc comment above. `mousedown`
  // (not `click`) so this also beats a click landing on another field.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeList();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function onTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (!open) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        // Close this panel only — see doc comment above for why
        // stopPropagation here doesn't also dismiss the parent dialog.
        e.preventDefault();
        e.stopPropagation();
        closeList();
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + options.length) % options.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        selectIndex(activeIndex);
        break;
      case "Tab":
        // Let Tab keep moving focus normally (including the parent dialog's
        // own Tab-cycle) — just don't leave the panel open behind it.
        closeList();
        break;
      default:
        break;
    }
  }

  const activeOption = open ? options[activeIndex] : undefined;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeOption ? `${listboxId}-${activeOption.value}` : undefined}
        aria-label={ariaLabel}
        aria-required={required}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-left text-sm outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:cursor-not-allowed disabled:opacity-60 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist"
      >
        <span
          className={
            selectedOption
              ? "truncate text-ink admin-dark:text-mist"
              : "truncate text-ink/40 admin-dark:text-mist/40"
          }
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink/40 admin-dark:text-mist/40" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          id={listboxId}
          aria-label={ariaLabel}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-ink/10 bg-white py-1 shadow-lg admin-dark:border-white/15 admin-dark:bg-admin-dark-surface"
        >
          {options.map((opt, index) => {
            const isActive = index === activeIndex;
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                id={`${listboxId}-${opt.value}`}
                role="option"
                aria-selected={isSelected}
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectIndex(index)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-navy/8 admin-dark:bg-white/10" : "hover:bg-ink/[0.03] admin-dark:hover:bg-white/5"
                } ${isSelected ? "font-semibold text-ink admin-dark:text-mist" : "text-ink/80 admin-dark:text-mist/80"}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default AdminSelect;
