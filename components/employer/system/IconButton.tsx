import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/components/employer/system/cx";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
  /** Required: an icon-only control has no visible text to name it. */
  "aria-label": string;
  icon: ReactNode;
  size?: "sm" | "md";
  className?: string;
};

/** Square icon-only button — 32 or 36px, ghost until hovered. Forwards its ref so menus can return focus to it. */
const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { icon, size = "sm", className, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      {...rest}
      className={cx(
        "inline-grid shrink-0 place-items-center rounded-control border border-transparent text-eh-muted transition-colors duration-150 hover:border-eh-line hover:bg-eh-surface hover:text-eh-ink disabled:pointer-events-none disabled:opacity-50 [&>svg]:h-4 [&>svg]:w-4",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
    >
      {icon}
    </button>
  );
});

export default IconButton;
