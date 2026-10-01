"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "@/components/employer/system/cx";

export type SelectOption = { value: string; label: string; description?: string; icon?: ReactNode };

const GAP = 6;
const EDGE = 8;

/**
 * The workspace dropdown — replaces native <select> so every picker looks
 * and behaves the same. An 8px trigger that shows the current choice; a
 * listbox rendered into the workspace root (no card or scroll container
 * can clip it), below the trigger or above it when there's no room.
 *
 * Keyboard: Enter / Space / ↓ opens on the current choice; ↑ ↓ Home End
 * move; typing a letter jumps to the next option starting with it; Enter
 * or Space picks; Escape closes and returns focus; Tab closes.
 *
 * With `placeholder` and an empty value it doubles as an action picker
 * ("Move to stage…"): handle onChange and keep value at "".
 */
export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  size = "md",
  disabled = false,
  className,
  menuWidth,
}: {
  /** Accessible name, e.g. "Sort job listings". Pair with a visible label where one exists. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown when no option matches `value`. */
  placeholder?: string;
  /** 32 / 36px. */
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  /** Menu width in px; defaults to the trigger's width (at least 180px). */
  menuWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  function openMenu() {
    if (disabled) return;
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function pick(index: number) {
    const option = options[index];
    if (!option) return;
    close(true);
    if (option.value !== value) onChange(option.value);
  }

  // Place the listbox before paint: under the trigger if it fits, else above.
  useLayoutEffect(() => {
    if (!open) return;
    const el = listRef.current;
    const trigger = buttonRef.current?.getBoundingClientRect();
    if (!el || !trigger) return;
    const width = Math.max(menuWidth ?? trigger.width, 180);
    el.style.width = `${width}px`;
    const height = el.getBoundingClientRect().height;
    const below = trigger.bottom + GAP;
    const above = trigger.top - GAP - height;
    const top = below + height <= window.innerHeight - EDGE || above < EDGE ? below : above;
    const left = Math.min(Math.max(EDGE, trigger.left), window.innerWidth - width - EDGE);
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.visibility = "visible";
  }, [open, menuWidth]);

  // Keep the active option in view and focused for screen readers.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!listRef.current?.contains(target) && !buttonRef.current?.contains(target)) close(false);
    }
    function onScroll(event: Event) {
      if (listRef.current?.contains(event.target as Node)) return;
      close(false);
    }
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  function onListKeyDown(event: React.KeyboardEvent) {
    const last = options.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(last, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(last);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      close(false);
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const letter = event.key.toLowerCase();
      const order = [...options.keys()].map((k) => (active + 1 + k) % options.length);
      const hit = order.find((i) => options[i].label.toLowerCase().startsWith(letter));
      if (hit !== undefined) setActive(hit);
    }
  }

  const host = typeof document !== "undefined" ? document.querySelector(".employer-workspace") : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cx(
          "inline-flex min-w-0 items-center gap-2 rounded-control border bg-eh-surface text-left text-ui transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-8 px-2.5" : "h-9 px-3",
          open ? "border-eh-teal" : "border-eh-line hover:border-[color-mix(in_srgb,var(--eh-ink)_22%,var(--eh-line))]",
          className
        )}
      >
        {selected?.icon && (
          <span className="inline-flex shrink-0 text-eh-muted [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
            {selected.icon}
          </span>
        )}
        <span className={cx("min-w-0 flex-1 truncate", selected ? "text-eh-ink" : "text-eh-muted")}>
          {selected?.label ?? placeholder ?? "Select…"}
        </span>
        <ChevronDown
          className={cx("h-4 w-4 shrink-0 text-eh-muted transition-transform duration-150", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {open &&
        host &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${listId}-${active}`}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            className="fixed z-50 max-h-72 overflow-y-auto rounded-[10px] border border-eh-line bg-eh-surface p-1.5 shadow-eh-lg outline-none"
            style={{ top: 0, left: 0, visibility: "hidden" }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value || `option-${index}`}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(index)}
                  onClick={() => pick(index)}
                  className={cx(
                    "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-chip px-2.5 text-ui sm:min-h-9",
                    index === active ? "bg-eh-surface-2" : "",
                    isSelected ? "font-semibold text-eh-ink" : "text-eh-ink-2"
                  )}
                >
                  {option.icon && (
                    <span className="inline-flex shrink-0 text-eh-muted [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                      {option.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description && (
                      <span className="block truncate text-small font-normal text-eh-muted">{option.description}</span>
                    )}
                  </span>
                  <Check
                    className={cx("h-4 w-4 shrink-0 text-eh-teal", isSelected ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                </li>
              );
            })}
          </ul>,
          host
        )}
    </>
  );
}
