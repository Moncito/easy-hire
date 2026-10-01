import type { ReactNode } from "react";
import { cx } from "@/components/employer/system/cx";

/**
 * A container, for content that actually needs one: analytics, grouped
 * data, actionable lists. Border and surface contrast do the work; the
 * shadow is a hairline. Don't wrap small sections in a Card — spacing and
 * a SectionHeader are usually enough.
 */
export function Card({
  children,
  as: Tag = "section",
  padded = true,
  tone = "default",
  className,
  ...aria
}: {
  children: ReactNode;
  as?: "section" | "div" | "article";
  /** 20px padding (24px from sm). Turn off for tables and lists that run edge to edge. */
  padded?: boolean;
  /** "attention" / "critical" tint the border for cards that need a decision. */
  tone?: "default" | "attention" | "critical";
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <Tag
      {...aria}
      className={cx(
        "rounded-card border bg-eh-surface shadow-eh-sm",
        tone === "critical"
          ? "border-[color-mix(in_srgb,var(--eh-danger)_35%,var(--eh-line))]"
          : tone === "attention"
            ? "border-[color-mix(in_srgb,var(--eh-marigold)_45%,var(--eh-line))]"
            : "border-eh-line",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </Tag>
  );
}

/** Title row inside a Card: title, optional description (a timeframe, a count), and a right-hand action. */
export function CardHeader({
  id,
  title,
  description,
  action,
  className,
}: {
  /** Pair with the Card's aria-labelledby. */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      <h2 id={id} className="text-card-title text-eh-ink">
        {title}
      </h2>
      {description && <span className="text-ui text-eh-muted">{description}</span>}
      {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
    </div>
  );
}

/** Heading for a page section that isn't in a card: Space Grotesk, 20px. */
export function SectionHeader({
  id,
  title,
  description,
  action,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 id={id} className="font-heading text-section text-eh-ink">
          {title}
        </h2>
        {description && <p className="mt-1.5 text-ui text-eh-muted">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

/** Page title block: Space Grotesk 32/700, an optional leading visual (logo), metadata, and actions. */
export function PageHeader({
  title,
  leading,
  meta,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  leading?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("flex flex-wrap items-center gap-4", className)}>
      {leading}
      <div className="min-w-0">
        <h1 className="truncate font-heading text-display text-eh-ink">{title}</h1>
        {meta && <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui text-eh-muted">{meta}</div>}
        {description && <p className="mt-2 max-w-2xl text-body text-eh-muted">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 max-[520px]:w-full min-[521px]:ml-auto">{actions}</div>
      )}
    </header>
  );
}
