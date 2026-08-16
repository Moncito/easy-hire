import type { ElementType, ReactNode } from "react";

type Variant = "raised" | "inset" | "flat";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  /** Renders without the default padding — caller controls spacing. */
  noPadding?: boolean;
  /** Adds the `.neo-pressable` press-feedback transition (raised → inset). */
  pressable?: boolean;
  as?: ElementType;
};

const variantClass: Record<Variant, string> = {
  raised: "neo-raised",
  inset: "neo-inset",
  flat: "neo-surface",
};

/**
 * Pro-only neomorphic panel. Renders as a plain rounded surface outside the
 * `[data-employer-plan="pro"]` scope (the neo-* classes are no-ops there),
 * so it's safe to use even if a Free path ever imports it by mistake.
 */
export default function NeoSurface({
  children,
  className = "",
  variant = "raised",
  noPadding = false,
  pressable = false,
  as: Tag = "div",
}: Props) {
  return (
    <Tag
      className={`${variantClass[variant]} rounded-2xl ${noPadding ? "" : "p-5"} ${
        pressable ? "neo-pressable" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
