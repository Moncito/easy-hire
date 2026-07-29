import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "teal" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-marigold text-ink shadow-sm hover:bg-marigold/90",
  teal: "bg-teal text-white shadow-sm shadow-teal/15 hover:bg-teal/95",
  secondary: "border border-ink/10 text-ink/75 hover:bg-ink/5",
  ghost: "text-ink/60 hover:bg-ink/5 hover:text-ink",
  danger: "border border-ember/20 text-ember hover:bg-ember/5",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export default function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
