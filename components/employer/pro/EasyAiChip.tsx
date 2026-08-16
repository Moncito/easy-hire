import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

type Variant = "chip" | "tile" | "inline";

type Props = {
  href?: string;
  variant?: Variant;
  label?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

/**
 * Easy AI entry point — gold shimmer chip (topbar / sidebar) or a larger
 * tile (Easy AI hub shortcuts). Shimmer respects `prefers-reduced-motion`
 * via the shared `.neo-shimmer` utility in globals.css.
 */
export default function EasyAiChip({
  href = "/employer/easy-ai",
  variant = "chip",
  label = "Easy AI",
  description,
  icon,
  className = "",
}: Props) {
  if (variant === "tile") {
    return (
      <Link
        href={href}
        className={`neo-raised-sm neo-pressable neo-shimmer group flex flex-col gap-2 rounded-2xl p-4 text-left transition-transform hover:-translate-y-0.5 ${className}`}
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--neo-gold)]/15 text-[color:var(--neo-gold)]">
          {icon ?? <Sparkles className="h-4 w-4" strokeWidth={2.25} />}
        </span>
        <span className="font-display text-sm font-bold text-[color:var(--neo-ink)]">{label}</span>
        {description && (
          <span className="text-xs leading-relaxed text-[color:var(--neo-muted)]">{description}</span>
        )}
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--neo-gold)] hover:underline ${className}`}
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title="Easy AI"
      className={`neo-raised-sm neo-pressable neo-shimmer inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-[color:var(--neo-gold)] ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}
