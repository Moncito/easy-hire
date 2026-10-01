import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, Sparkles } from "lucide-react";
import { cx } from "@/components/employer/system/cx";

export type BannerTone = "attention" | "critical" | "assist";

const TONE: Record<BannerTone, { box: string; icon: string; Icon: typeof AlertCircle }> = {
  attention: {
    box: "border-[color-mix(in_srgb,var(--eh-marigold)_40%,var(--eh-line))] bg-eh-marigold-tint",
    icon: "text-eh-marigold-ink",
    Icon: AlertCircle,
  },
  critical: {
    box: "border-[color-mix(in_srgb,var(--eh-danger)_30%,var(--eh-line))] bg-eh-danger-tint",
    icon: "text-eh-danger",
    Icon: AlertTriangle,
  },
  // Easy AI suggestions: teal, so AI help reads as help, not a warning.
  assist: {
    box: "border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint",
    icon: "text-eh-teal",
    Icon: Sparkles,
  },
};

/**
 * An operational reminder with one clear action — not an error. Marigold
 * for "worth a look", Ember only when something is genuinely overdue, teal
 * for Easy AI suggestions. Dark text throughout for readability.
 */
export default function AttentionBanner({
  tone = "attention",
  title,
  description,
  action,
  icon,
  className,
}: {
  tone?: BannerTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Overrides the tone's default icon. */
  icon?: ReactNode;
  className?: string;
}) {
  const style = TONE[tone];
  const Icon = style.Icon;
  return (
    <div
      role={tone === "critical" ? "alert" : "status"}
      className={cx("flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border px-4 py-3.5", style.box, className)}
    >
      <span className={cx("shrink-0 [&>svg]:h-5 [&>svg]:w-5", style.icon)} aria-hidden="true">
        {icon ?? <Icon />}
      </span>
      <div className="min-w-[200px] flex-1">
        <p className="text-body font-semibold text-eh-ink">{title}</p>
        {description && <p className="mt-0.5 text-ui text-eh-ink-2">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
