import type { ReactNode } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type LinkProps = BaseProps & {
  href: string;
  onClick?: never;
};

type Props = ButtonProps | LinkProps;

const sizeClass: Record<Size, string> = {
  sm: "px-3.5 py-2 text-xs gap-1.5",
  md: "px-5 py-2.5 text-sm gap-2",
};

function variantClass(variant: Variant) {
  if (variant === "primary") {
    return "bg-[color:var(--neo-teal)] text-white shadow-[0_10px_24px_-8px_rgba(31,128,115,0.55)]";
  }
  if (variant === "secondary") {
    return "neo-raised-sm text-[color:var(--neo-ink)]";
  }
  return "text-[color:var(--neo-muted)] hover:text-[color:var(--neo-ink)]";
}

/** Pro neomorphic button — raised by default, presses to inset on click. */
export default function NeoButton(props: Props) {
  const { children, variant = "secondary", size = "md", icon, className = "" } = props;
  const disabledClasses =
    "href" in props ? "" : (props as ButtonProps).disabled ? "cursor-not-allowed opacity-50" : "";
  const classes = `neo-pressable inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-transform active:scale-[0.98] ${sizeClass[size]} ${variantClass(variant)} ${disabledClasses} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = props as ButtonProps;

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {icon}
      {children}
    </button>
  );
}
