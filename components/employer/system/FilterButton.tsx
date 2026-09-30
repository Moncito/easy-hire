import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/components/employer/system/cx";

/**
 * A combinable filter toggle ("Needs review", "Has applicants"). Pill
 * shaped — filters are one of the few things that are. Pressed state is in
 * aria-pressed and a filled style, plus an optional count. For mutually
 * exclusive choices use SegmentedControl; for many options, a dropdown.
 */
export default function FilterButton({
  active,
  count,
  children,
  className,
  type,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  active: boolean;
  count?: number;
  className?: string;
}) {
  return (
    <button
      {...rest}
      type={type ?? "button"}
      aria-pressed={active}
      className={cx(
        "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-ui transition-colors duration-150",
        active
          ? "border-eh-ink bg-eh-ink font-medium text-eh-surface"
          : "border-eh-line bg-eh-surface text-eh-ink-2 hover:border-eh-muted hover:text-eh-ink",
        className
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cx("num text-xs", active ? "text-eh-surface/70" : "text-eh-muted")}>{count}</span>
      )}
    </button>
  );
}
