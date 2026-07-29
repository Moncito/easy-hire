import type { ReactNode } from "react";

export type BadgeTone = "marigold" | "teal" | "navy" | "ink" | "ember" | "outline";

const TONE_CLASSES: Record<BadgeTone, string> = {
  marigold: "bg-marigold/12 text-[#8a5a10]",
  teal: "bg-teal/10 text-teal",
  navy: "bg-navy/10 text-navy",
  ink: "bg-ink/5 text-ink/65",
  ember: "bg-ember/10 text-ember",
  outline: "border border-ink/10 text-ink/70",
};

export type BadgeSize = "sm" | "md";

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-1.5 py-0.5 text-[9px]",
  md: "px-2.5 py-1 text-[11px]",
};

type Props = {
  tone?: BadgeTone;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
  uppercase?: boolean;
};

export default function Badge({ tone = "ink", size = "md", children, className = "", uppercase = false }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg font-semibold ${SIZE_CLASSES[size]} ${
        uppercase ? "uppercase tracking-wider" : ""
      } ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
