"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import IconButton from "@/components/employer/system/IconButton";
import { cx } from "@/components/employer/system/cx";

export type MenuItem =
  | { label: string; href: string; external?: boolean; tone?: "default" | "danger"; hidden?: boolean }
  | { label: string; onSelect: () => void; tone?: "default" | "danger"; hidden?: boolean };

/**
 * A menu of actions behind a trigger (default: "⋯"). Rendered into the
 * workspace root so scroll containers can't clip it while it keeps the
 * --eh-* theme. Keyboard: opens with focus on the first item; ↑/↓, Home and
 * End move between items; Escape closes and returns focus to the trigger.
 * Outside clicks and scrolling close it. Items can be permission-gated
 * with `hidden`.
 */
export default function DropdownMenu({
  label,
  items,
  trigger,
}: {
  /** Accessible name for the trigger and the menu, e.g. "More actions for Bookkeeper". */
  label: string;
  items: MenuItem[];
  /** Custom trigger icon; defaults to "⋯". */
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open) return;
    const itemsEls = () => [...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    itemsEls()[0]?.focus();

    function close(returnFocus: boolean) {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus();
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close(false);
    }
    function onKey(event: KeyboardEvent) {
      const els = itemsEls();
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
    function onScroll() {
      close(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  if (visible.length === 0) return null;

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setOpen((v) => !v);
  }

  const itemClass = (tone?: "default" | "danger") =>
    cx(
      "block w-full rounded-[6px] px-2.5 py-1.5 text-left text-ui outline-none transition-colors duration-150 hover:bg-eh-surface-2 focus-visible:bg-eh-surface-2",
      tone === "danger" ? "text-eh-danger" : "text-eh-ink-2 hover:text-eh-ink focus-visible:text-eh-ink"
    );

  const host = typeof document !== "undefined" ? document.querySelector(".employer-workspace") : null;

  return (
    <>
      <IconButton
        ref={buttonRef}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        icon={trigger ?? <MoreHorizontal />}
      />
      {open &&
        pos &&
        host &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            className="fixed z-50 min-w-[172px] rounded-control border border-eh-line bg-eh-surface p-1 shadow-eh-lg"
            style={{ top: pos.top, right: pos.right }}
          >
            {visible.map((item) =>
              "href" in item ? (
                <Link
                  key={item.label}
                  role="menuitem"
                  href={item.href}
                  className={itemClass(item.tone)}
                  onClick={() => setOpen(false)}
                  {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={itemClass(item.tone)}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {item.label}
                </button>
              )
            )}
          </div>,
          host
        )}
    </>
  );
}
