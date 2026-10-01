/* eslint-disable @next/next/no-img-element -- avatars are user-uploaded URLs of unknown host and size; next/image would need every storage host whitelisted and adds nothing at 24–48px. */
import { cx } from "@/components/employer/system/cx";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

/** 24 / 32 / 36 / 48px. */
const SIZE: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
};

/** Brand-derived fallbacks, picked by name so a person keeps the same colour everywhere. */
const FALLBACKS = ["bg-eh-navy text-white", "bg-eh-teal text-white", "bg-[#8a5300] text-white", "bg-eh-ink-2 text-eh-surface"];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function fallbackFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACKS[hash % FALLBACKS.length];
}

/**
 * The one avatar: circular, consistent sizes, photo cropped to fill, and
 * initials on a stable brand colour when there's no photo. `shape="square"`
 * is for company logos (8px corners).
 */
export default function Avatar({
  name,
  src,
  size = "md",
  shape = "circle",
  className,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  shape?: "circle" | "square";
  className?: string;
}) {
  const box = cx(
    "inline-grid shrink-0 place-items-center overflow-hidden font-semibold",
    SIZE[size],
    shape === "circle" ? "rounded-full" : "rounded-control",
    className
  );
  if (src) {
    return <img src={src} alt="" className={cx(box, "object-cover")} loading="lazy" decoding="async" />;
  }
  return (
    <span className={cx(box, fallbackFor(name))} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
