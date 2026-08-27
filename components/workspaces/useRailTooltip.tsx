"use client";

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Hover/focus label for a collapsed sidebar rail. The label is rendered in a
 * portal on `document.body` with `position: fixed`, so it escapes the rail
 * without widening its scroll area — an `absolute` tooltip inside the rail's
 * `overflow-y-auto` nav adds horizontal scroll width and gets clipped by the
 * forced `overflow-x`. Pass `enabled = false` (i.e. the rail is expanded) to
 * make this inert.
 */
export function useRailTooltip(label: string, enabled: boolean) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const setAnchor = useCallback((node: HTMLElement | null) => {
    anchorRef.current = node;
  }, []);

  const open = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top + r.height / 2, left: r.right + 12 });
  }, []);

  const close = useCallback(() => setPos(null), []);

  // No effect needed to clear on expand: `anchorProps` is empty and `tooltip`
  // is null whenever `enabled` is false, so a stale `pos` is never rendered and
  // is refreshed by the next hover.
  const anchorProps = enabled
    ? {
        ref: setAnchor,
        onMouseEnter: open,
        onMouseLeave: close,
        onFocus: open,
        onBlur: close,
      }
    : {};

  const tooltip =
    enabled && pos && typeof document !== "undefined"
      ? createPortal(
          <span
            role="tooltip"
            className="pointer-events-none fixed z-[70] -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-mist shadow-lg shadow-ink/25"
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </span>,
          document.body,
        )
      : null;

  return { anchorProps, tooltip };
}
