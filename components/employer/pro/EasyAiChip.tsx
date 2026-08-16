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
        className={`pro-card group flex flex-col gap-2 p-5 text-left transition hover:border-marigold/25 hover:shadow-md ${className}`}
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-marigold/12 text-[var(--pro-accent-ink)]">
          {icon ?? <Sparkles className="h-4 w-4" strokeWidth={2.25} />}
        </span>
        <span className="font-display text-base font-bold text-ink">{label}</span>
        {description && (
          <span className="text-sm leading-relaxed text-ink/50">{description}</span>
        )}
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--pro-accent-ink)] hover:underline ${className}`}
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-marigold/12 px-3 py-1.5 text-xs font-bold text-[var(--pro-accent-ink)] ring-1 ring-marigold/25 transition hover:bg-marigold/18 ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
      {label}
    </Link>
  );
}
