import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/components/employer/system/cx";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
  /** Required: an icon-only control has no visible text to name it. */
  "aria-label": string;
  icon: ReactNode;
  /** 32 / 36 / 40px. */
  size?: "sm" | "md" | "lg";
  /**
   * ghost: no container until hovered (toolbars, table rows).
   * outline: bordered surface, for sitting next to a Button of the same height.
   */
  variant?: "ghost" | "outline";
  className?: string;
};

const SIZE = { sm: "h-8 w-8", md: "h-9 w-9", lg: "h-10 w-10" } as const;

const VARIANT = {
  ghost:
    "border-transparent text-eh-muted hover:border-eh-line hover:bg-eh-surface hover:text-eh-ink aria-expanded:border-eh-line aria-expanded:bg-eh-surface-2 aria-expanded:text-eh-ink",
  outline:
    "border-eh-line bg-eh-surface text-eh-ink-2 hover:bg-eh-surface-2 hover:text-eh-ink active:bg-[color-mix(in_srgb,var(--eh-ink)_8%,var(--eh-surface))] aria-expanded:bg-[color-mix(in_srgb,var(--eh-ink)_8%,var(--eh-surface))] aria-expanded:text-eh-ink",
} as const;

/** Square icon-only button. Forwards its ref so menus can return focus to it. */
const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon, size = "sm", variant = "ghost", className, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      {...rest}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-control border transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4",
        SIZE[size],
        VARIANT[variant],
        className
      )}
    >
      {icon}
    </button>
  );
});

export default IconButton;
