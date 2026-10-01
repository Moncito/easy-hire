"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import IconButton from "@/components/employer/system/IconButton";
import { cx } from "@/components/employer/system/cx";

type ItemBase = {
  label: string;
  /** 16px Lucide icon, muted — the label stays the main element. */
  icon?: ReactNode;
  /** "danger" for destructive actions; they're also set apart by a divider. */
  tone?: "default" | "danger";
  /** Draw a divider above this item (group destructive actions last). */
  separatorBefore?: boolean;
  hidden?: boolean;
};

export type MenuItem =
  | (ItemBase & {
      href: string;
      external?: boolean;
      /** Plain <a> instead of a Next.js Link — for downloads and API routes. */
      native?: boolean;
    })
  | (ItemBase & { onSelect: () => void });

const GAP = 6;
const EDGE = 8;

/**
 * A menu of secondary actions behind a trigger (default "⋯").
 *
 * - Rendered into the workspace root, so no card, grid or scroll container
 *   can clip it, and it keeps the --eh-* theme.
 * - Anchored to the trigger's right edge; opens downward, or upward when
 *   there isn't room below. Kept inside the viewport horizontally.
 * - Keyboard: opens with focus on the first item; ↑/↓, Home/End move,
 *   Enter activates, Escape closes and returns focus, Tab closes.
 *   Outside clicks and scrolling close it.
 * - Items can carry an icon, a divider above them, a danger tone, and be
 *   hidden when they don't apply to the current state.
 */
export default function DropdownMenu({
  label,
  items,
  trigger,
  triggerVariant = "ghost",
  triggerSize = "sm",
  tooltip,
}: {
  /** Accessible name for the trigger and the menu, e.g. "More actions for Bookkeeper". */
  label: string;
  items: MenuItem[];
  /** Custom trigger icon; defaults to "⋯". */
  trigger?: ReactNode;
  triggerVariant?: "ghost" | "outline";
  triggerSize?: "sm" | "md" | "lg";
  /** Short hover hint, e.g. "More actions". */
  tooltip?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  // Measure the menu once it's in the DOM, then place it: below the trigger
  // if it fits, otherwise above; right-aligned to the trigger, clamped to
  // the viewport. Runs before paint, so it never flashes in the wrong spot.
  useLayoutEffect(() => {
    if (!open) return;
    const el = menuRef.current;
    const button = buttonRef.current?.getBoundingClientRect();
    const menu = el?.getBoundingClientRect();
    if (!el || !button || !menu) return;
    const below = button.bottom + GAP;
    const fitsBelow = below + menu.height <= window.innerHeight - EDGE;
    const above = button.top - GAP - menu.height;
    const top = fitsBelow || above < EDGE ? below : above;
    const left = Math.min(Math.max(EDGE, button.right - menu.width), window.innerWidth - menu.width - EDGE);
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.visibility = "visible";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const itemEls = () => [...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    itemEls()[0]?.focus();

    function close(returnFocus: boolean) {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close(false);
    }
    function onKey(event: KeyboardEvent) {
      const els = itemEls();
      const index = els.indexOf(document.activeElement as HTMLElement);
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        els[(index + 1) % els.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        els[(index - 1 + els.length) % els.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        els[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        els[els.length - 1]?.focus();
      } else if (event.key === "Tab") {
        close(false);
      }
    }
    function onScroll(event: Event) {
      // Scrolling inside the menu itself (long menus on small screens) is fine.
      if (menuRef.current?.contains(event.target as Node)) return;
      close(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const itemClass = (tone?: "default" | "danger") =>
    cx(
      "flex min-h-10 w-full items-center gap-2.5 rounded-chip px-3 text-left text-ui outline-none transition-colors duration-150 sm:min-h-9",
      tone === "danger"
        ? "text-eh-danger hover:bg-eh-danger-tint focus-visible:bg-eh-danger-tint"
        : "text-eh-ink hover:bg-eh-surface-2 focus-visible:bg-eh-surface-2"
    );

  const iconSlot = (item: MenuItem) =>
    item.icon ? (
      <span
        className={cx(
          "inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4",
          item.tone === "danger" ? "text-eh-danger" : "text-eh-muted"
        )}
        aria-hidden="true"
      >
        {item.icon}
      </span>
    ) : null;

  const host = typeof document !== "undefined" ? document.querySelector(".employer-workspace") : null;

  return (
    <>
      <IconButton
        ref={buttonRef}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        title={open ? undefined : tooltip}
        onClick={() => setOpen((v) => !v)}
        variant={triggerVariant}
        size={triggerSize}
        icon={trigger ?? <MoreHorizontal />}
      />
      {open &&
        host &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            className="fixed z-50 max-h-[calc(100vh-16px)] w-[216px] overflow-y-auto rounded-[10px] border border-eh-line bg-eh-surface px-1.5 py-2 shadow-eh-lg"
            // Hidden until the layout effect has measured and placed it.
            style={{ top: 0, left: 0, visibility: "hidden" }}
          >
            {visible.map((item) => (
              <div key={item.label}>
                {item.separatorBefore && <div role="separator" className="-mx-1.5 my-1.5 h-px bg-eh-line" />}
                {"href" in item && item.native ? (
                  <a
                    role="menuitem"
                    href={item.href}
                    className={itemClass(item.tone)}
                    onClick={() => setOpen(false)}
                  >
                    {iconSlot(item)}
                    {item.label}
                  </a>
                ) : "href" in item ? (
                  <Link
                    role="menuitem"
                    href={item.href}
                    className={itemClass(item.tone)}
                    onClick={() => setOpen(false)}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {iconSlot(item)}
                    {item.label}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClass(item.tone)}
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                  >
                    {iconSlot(item)}
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </div>,
          host
        )}
    </>
  );
}
