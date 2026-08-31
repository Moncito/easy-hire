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
  /**
   * Internal only — set by SeekerNavBandBleed, which is the only place this
   * band shares the viewport with the fixed SeekerWorkspaceSwitcher pill
   * (app/seeker/layout.tsx). Reserves room on the right, lg: and up, so the
   * greeting/badge group ends before the switcher instead of running under
   * it. Not intended to be passed by other callers of SeekerNavBand.
   */
  reserveSwitcherGutter?: boolean;
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
  reserveSwitcherGutter = false,
}: SeekerNavBandProps) {
  const fallbackHint = hint ?? "VA marketplace";

  return (
    <div
      className={`seeker-nav-band relative flex h-12 shrink-0 items-center justify-between gap-3 px-4 sm:h-14 sm:px-6 lg:h-16 lg:px-8${className ? ` ${className}` : ""}`}
    >
      {/* Brand + section + greeting/badge — bounded on lg+ (only when
          reserveCenter is on) so it can never reach the centered reserve
          where the floating pill nav sits. At lg, the reserve is
          min(100%,30rem) wide, centered on the full band
          (absolute inset-x-0 against the band's own padding box, ignoring
          the band's px-8). Left content starts after that lg:px-8 (2rem)
          inset. calc(50% - 16rem) — where the 50% resolves against this
          flex item's containing block, i.e. the band's *content* box
          (already inside the 2rem/side padding) — lands the left cluster's
          right edge a constant ~1rem short of the reserve's left edge at
          any band width from 1024px up to the 1440px shell cap. Below lg
          the reserve is hidden entirely (replaced by the bottom nav), so no
          cap is needed there. overflow-hidden is a backstop: individual
          text nodes already truncate, this just guarantees nothing (e.g. a
          non-truncating badge pill) can visually bleed past the boundary. */}
      <div
        className={`flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3 lg:flex-none${reserveCenter ? " lg:max-w-[calc(50%-16rem)]" : ""}`}
      >
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

        {/* Greeting/badge, relocated from the right edge. The separator
            mirrors the divider above; it must track the same visibility as
            whatever follows it, otherwise a bare "|" shows with nothing
            after it. `badge` (when passed) renders at every breakpoint
            (unchanged from before), so the divider does too; the
            fallback-hint text stays sm+-only, so the divider matches that
            instead when there's no badge. */}
        <span
          className={
            badge
              ? "h-4 w-px shrink-0 bg-ink/10"
              : "hidden h-4 w-px shrink-0 bg-ink/10 sm:inline-block"
          }
          aria-hidden="true"
        />
        {metaLabel && (
          <span className="hidden max-w-[6.5rem] truncate text-xs font-medium text-ink/50 sm:inline lg:max-w-[11rem]">
            {metaLabel}
          </span>
        )}
        <span className="shrink-0">
          {badge ?? (
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-ink/30 sm:inline">
              {fallbackHint}
            </span>
          )}
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

      {/* Only actions (e.g. guest Log in / Get started) live on the right
          now — metaLabel/badge moved into the left cluster above. Render
          nothing at all when there are no actions, so an empty div doesn't
          sit in this justify-between row carrying a stale gutter margin. */}
      {actions && (
        <div
          className={`flex shrink-0 items-center justify-end gap-2${reserveSwitcherGutter ? " lg:mr-52" : ""}`}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

export function SeekerNavBandBleed(props: SeekerNavBandProps) {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* reserveSwitcherGutter is forced here (not exposed to callers) —
          see the prop doc above for why this is the one seam that needs it. */}
      <SeekerNavBand {...props} reserveSwitcherGutter />
    </div>
  );
}
