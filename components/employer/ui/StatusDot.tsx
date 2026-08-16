type Color = "teal" | "navy" | "ember" | "muted";

const colorClass: Record<Color, string> = {
  teal: "bg-teal",
  navy: "bg-navy/50",
  ember: "bg-ember",
  muted: "bg-ink/30",
};

type Props = {
  color?: Color;
  className?: string;
};

/**
 * Shared verification / status dot. Use `color="ember"` only for
 * genuine warnings (REJECTED). Replaces inline `h-2 w-2 rounded-full`
 * patterns scattered across Topbar, BillingStatusStrip, and KanbanColumn.
 */
export default function StatusDot({ color = "muted", className = "" }: Props) {
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${colorClass[color]} ${className}`}
      aria-hidden="true"
    />
  );
}
