import { Crown } from "lucide-react";

type Size = "sm" | "md";

type Props = {
  size?: Size;
  className?: string;
  label?: string;
};

const sizeClass: Record<Size, string> = {
  sm: "h-4 gap-1 px-1.5 text-[9px]",
  md: "h-5 gap-1.5 px-2 text-[10px]",
};

const iconSize: Record<Size, string> = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
};

/** Marigold Pro mark — navbar, badges. */
export default function ProBadge({ size = "md", className = "", label = "Pro" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-marigold/15 font-bold uppercase tracking-wider text-[var(--pro-accent-ink)] ring-1 ring-marigold/30 ${sizeClass[size]} ${className}`}
    >
      <Crown className={iconSize[size]} strokeWidth={2.5} />
      {label}
    </span>
  );
}
