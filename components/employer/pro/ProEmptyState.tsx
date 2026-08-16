import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  /** Tighter padding for nested card interiors (e.g. applicant list). */
  compact?: boolean;
  /** When nested inside another pro-card, skip the outer card shell. */
  embedded?: boolean;
  className?: string;
};

/** Pro-styled empty state using the shared `pro-card` surface. */
export default function ProEmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  embedded = false,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        embedded ? "" : "pro-card"
      } ${compact ? "rounded-xl px-4 py-10" : "px-6 py-14"} ${className}`}
    >
      {icon && <div className="text-ink/30">{icon}</div>}
      <h3 className={`font-display font-bold text-ink ${compact ? "mt-3 text-base" : "text-lg"}`}>
        {title}
      </h3>
      <p
        className={`mx-auto max-w-sm leading-relaxed text-ink/50 ${
          compact ? "mt-1.5 text-sm" : "mt-2 text-sm"
        }`}
      >
        {description}
      </p>
      {action && <div className={compact ? "mt-4" : "mt-6"}>{action}</div>}
    </div>
  );
}
