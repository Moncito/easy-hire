import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function SeekerLogoMark({ className = "h-6 w-6 sm:h-7 sm:w-7" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full ${className}`}>
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
  /** Extra right-side controls (e.g. Log in / Get started for guests). */
  actions?: React.ReactNode;
  /** Reserve empty center space for the floating pill. Default true. */
  reserveCenter?: boolean;
};

export default function SeekerNavBand({
  section,
  icon: Icon,
  badge,
  hint,
  metaLabel,
  homeHref = "/seeker/dashboard",
  className,
  actions,
  reserveCenter = true,
}: SeekerNavBandProps) {
  const fallbackHint = hint ?? "VA marketplace";

  return (
    <div
      className={`seeker-nav-band relative flex h-12 shrink-0 items-center justify-between gap-3 px-4 sm:h-14 sm:px-6 lg:h-16 lg:px-8${className ? ` ${className}` : ""}`}
    >
      {/* Brand + section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none">
        <Link
          href={homeHref}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-85"
        >
          <SeekerLogoMark />
          <span className="font-display text-sm font-bold text-ink">EasyHire</span>
        </Link>

        <span className="h-4 w-px shrink-0 bg-ink/10" aria-hidden="true" />

        <span className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-marigold/70" aria-hidden="true" />
          <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-ink/45 sm:text-[11px]">
            {section}
          </span>
        </span>
      </div>

      {reserveCenter && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-full items-center justify-center lg:flex"
          aria-hidden="true"
        >
          <div className="h-full w-[min(100%,20rem)] sm:w-[min(100%,24rem)] lg:w-[min(100%,30rem)]" />
        </div>
      )}

      <div className="flex shrink-0 items-center justify-end gap-2">
        {actions ?? (
          <>
            {metaLabel && (
              <span className="hidden max-w-[6.5rem] truncate text-xs font-medium text-ink/50 sm:inline lg:max-w-[11rem]">
                {metaLabel}
              </span>
            )}
            {badge ?? (
              <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-ink/30 sm:inline">
                {fallbackHint}
              </span>
            )}
          </>
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
