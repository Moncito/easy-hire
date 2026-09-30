import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cx } from "@/components/employer/system/cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "border-eh-marigold bg-eh-marigold font-semibold text-[#241500] hover:border-eh-marigold-strong hover:bg-eh-marigold-strong",
  secondary: "border-eh-line bg-eh-surface font-medium text-eh-ink hover:bg-eh-surface-2",
  ghost: "border-transparent bg-transparent font-medium text-eh-muted hover:bg-eh-surface-2 hover:text-eh-ink",
  destructive: "border-eh-danger bg-eh-danger font-semibold text-white hover:opacity-90",
};

/** Heights 32 / 36 / 40px. `lg` is the card call-to-action size, matched by IconButton `lg`. */
const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-ui",
  md: "h-9 gap-1.5 px-3.5 text-ui",
  lg: "h-10 gap-2 px-4 text-ui",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control border transition-[color,background-color,border-color,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon, 16px. Hidden from assistive tech — the label carries the meaning. */
  icon?: ReactNode;
  /** Shows a spinner, disables the button, and sets aria-busy. */
  loading?: boolean;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };
type AsLink = Common & { href: string; prefetch?: boolean; target?: string; rel?: string; "aria-label"?: string };

/**
 * The one button of the employer workspace. Four variants:
 *  - primary: marigold, the page's main action ("Post a job")
 *  - secondary: bordered surface ("Review applicants")
 *  - ghost: no container, for quieter actions ("View all")
 *  - destructive: Ember, for actions that can't be undone
 * Renders a Next.js Link when given `href`, otherwise a <button>.
 */
export default function Button(props: AsButton | AsLink) {
  const { variant = "secondary", size = "md", icon, loading = false, className, children } = props;
  const classes = cx(BASE, VARIANT[variant], SIZE[size], className);
  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      ) : (
        icon && <span className="inline-flex [&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">{icon}</span>
      )}
      {children}
    </>
  );

  if (props.href !== undefined) {
    const { href, prefetch, target, rel } = props;
    return (
      <Link
        href={href}
        prefetch={prefetch}
        target={target}
        rel={rel}
        aria-label={props["aria-label"]}
        aria-disabled={loading || undefined}
        className={classes}
      >
        {content}
      </Link>
    );
  }

  // Pass through native button attributes only — not this component's own props.
  const rest: ButtonHTMLAttributes<HTMLButtonElement> = { ...props };
  for (const key of ["variant", "size", "icon", "loading", "className", "children", "href"] as const) {
    delete (rest as Record<string, unknown>)[key];
  }
  return (
    <button
      {...rest}
      type={props.type ?? "button"}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
