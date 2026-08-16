import type { ReactNode } from "react";
import Link from "next/link";

type Size = "sm" | "md";

type BaseProps = {
  icon: ReactNode;
  label: string;
  size?: Size;
  className?: string;
  active?: boolean;
};

type ButtonProps = BaseProps & { href?: undefined; onClick?: () => void };
type LinkProps = BaseProps & { href: string; onClick?: never };

type Props = ButtonProps | LinkProps;

const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

/** Pro neomorphic icon button — raised chip, presses to inset. */
export default function NeoIconButton(props: Props) {
  const { icon, label, size = "md", className = "", active = false } = props;
  const classes = `neo-pressable inline-flex shrink-0 items-center justify-center rounded-xl transition-colors ${
    active
      ? "neo-inset-sm text-[color:var(--neo-teal)]"
      : "neo-raised-sm text-[color:var(--neo-muted)] hover:text-[color:var(--neo-ink)]"
  } ${sizeClass[size]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes} title={label} aria-label={label}>
        {icon}
      </Link>
    );
  }

  const { onClick } = props as ButtonProps;

  return (
    <button type="button" onClick={onClick} className={classes} title={label} aria-label={label}>
      {icon}
    </button>
  );
}
