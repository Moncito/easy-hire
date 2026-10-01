"use client";

import Link from "next/link";
import { cx } from "@/components/employer/system/cx";

export type SegmentOption<T extends string> = { value: T; label: string; href?: string };

const ITEM =
  "num inline-flex h-7 items-center rounded-[6px] px-2.5 text-ui transition-colors duration-150";
const ACTIVE = "bg-eh-surface-2 font-semibold text-eh-ink shadow-[inset_0_0_0_1px_var(--eh-line)]";
const IDLE = "text-eh-muted hover:text-eh-ink";

/**
 * Mutually exclusive options (7d / 30d / 60d, list / board). Two modes:
 *  - every option has `href`: links, for state that belongs in the URL;
 *    the current one carries aria-current.
 *  - otherwise: a radio group driven by `onChange`.
 */
export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  /** Accessible name for the group, e.g. "Date range". */
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange?: (value: T) => void;
  className?: string;
}) {
  const asLinks = options.every((o) => o.href !== undefined);
  const wrapper = cx("inline-flex rounded-control border border-eh-line bg-eh-surface p-0.5", className);

  if (asLinks) {
    return (
      <nav aria-label={label} className={wrapper}>
        {options.map((o) => (
          <Link
            key={o.value}
            href={o.href!}
            scroll={false}
            aria-current={o.value === value ? "true" : undefined}
            className={cx(ITEM, o.value === value ? ACTIVE : IDLE)}
          >
            {o.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className={wrapper}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange?.(o.value)}
          className={cx(ITEM, o.value === value ? ACTIVE : IDLE)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
