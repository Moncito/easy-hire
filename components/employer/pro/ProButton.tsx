import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "onAccent";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
};

type ButtonProps = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
    href?: undefined;
  };

type LinkProps = BaseProps & {
  href: string;
};

type Props = ButtonProps | LinkProps;

function variantClass(variant: Variant) {
  switch (variant) {
    case "primary":
      return "bg-marigold text-ink shadow-sm shadow-marigold/20 hover:bg-marigold/90";
    case "secondary":
      return "border border-ink/10 bg-white text-ink hover:border-ink/15 hover:bg-ink/[0.02]";
    case "onAccent":
      return "border border-ink/10 bg-white/95 text-ink hover:bg-white";
    case "ghost":
    default:
      return "text-ink/70 hover:bg-ink/5 hover:text-ink";
  }
}

/** Twisty-style pill button for Employer Pro surfaces. */
export default function ProButton(props: Props) {
  const {
    children,
    variant = "secondary",
    icon,
    fullWidth = false,
    className = "",
  } = props;

  const classes = [
    "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-[0.98]",
    variantClass(variant),
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  const { type = "button", disabled, onClick, ...rest } = props as ButtonProps;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${classes}${disabled ? " cursor-not-allowed opacity-50" : ""}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
