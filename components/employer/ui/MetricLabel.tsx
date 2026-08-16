import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Additional Tailwind classes — e.g. a different text-ink/XX shade. */
  className?: string;
  as?: "p" | "span" | "label";
};

/**
 * Authoritative operational metric/section label.
 * Enforces the 12px minimum size mandated by the design system.
 * Replaces the previous ad-hoc `text-xs font-bold uppercase tracking-wider` pattern.
 */
export default function MetricLabel({ children, className = "", as: Tag = "p" }: Props) {
  return (
    <Tag className={`text-xs font-bold uppercase tracking-wider text-ink/50 ${className}`}>
      {children}
    </Tag>
  );
}
