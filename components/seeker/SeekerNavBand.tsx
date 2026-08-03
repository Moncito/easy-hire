import Link from "next/link";
import type { LucideIcon } from "lucide-react";

function LogoMark() {
  return (
    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full sm:h-7 sm:w-7">
      <div
        className="absolute inset-0 bg-marigold"
        style={{ clipPath: "polygon(0 0,100% 0,0 100%)" }}
      />
      <div
        className="absolute inset-0 bg-teal"
        style={{ clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
      />
    </div>
  );
}

export type SeekerNavBandProps = {
  section: string;
  icon: LucideIcon;
  badge?: React.ReactNode;
  hint?: string;
  metaLabel?: string | null;
  /** Defaults to seeker dashboard; use `/` on public job board for guests. */
  homeHref?: string;
  className?: string;
};

export default function SeekerNavBand({
  section,
  icon: Icon,
  badge,
  hint,
  metaLabel,
  homeHref = "/seeker/dashboard",
  className,
}: SeekerNavBandProps) {
  return (
    <div
      className={`seeker-nav-band relative flex h-14 shrink-0 items-center justify-between px-6 sm:h-16 sm:px-8${className ? ` ${className}` : ""}`}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-85"
        >
          <LogoMark />
          <span className="font-display text-sm font-bold text-ink">EasyHire</span>
        </Link>
        <span className="hidden h-4 w-px shrink-0 bg-ink/10 md:block" aria-hidden="true" />
        <span className="hidden items-center gap-1.5 md:flex">
          <Icon className="h-3.5 w-3.5 text-marigold/70" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-ink/45">
            {section}
          </span>
        </span>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-full w-[min(100%,19rem)]" />
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        {metaLabel && (
          <span className="hidden max-w-[11rem] truncate text-xs font-medium text-ink/50 lg:inline">
            {metaLabel}
          </span>
        )}
        {badge ?? (
          <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-ink/30 sm:inline">
            {hint ?? "VA marketplace"}
          </span>
        )}
      </div>
    </div>
  );
}

export function SeekerNavBandBleed(props: SeekerNavBandProps) {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <SeekerNavBand {...props} />
    </div>
  );
}
