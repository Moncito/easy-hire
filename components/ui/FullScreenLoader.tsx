"use client";

/**
 * Branded full-viewport overlay for slow client-driven actions (switching
 * workspace, signing out) so the user gets immediate feedback instead of a
 * dead click. Render it conditionally from a `useTransition` `isPending` or a
 * local pending flag. Uses a dark scrim so it reads the same in light and dark.
 */
export default function FullScreenLoader({
  label,
  sublabel,
}: {
  label: string;
  sublabel?: string;
}) {
  return (
    <div
      className="animate-fade-in fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-ink/75 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        {/* sweeping ring */}
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/15 border-t-marigold [animation-duration:1.1s]" />
        {/* rotating EasyHire mark */}
        <span className="relative h-11 w-11 animate-spin overflow-hidden rounded-full shadow-lg ring-1 ring-white/10 [animation-duration:2.4s]">
          <span className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
          <span className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
        </span>
      </div>

      <div className="text-center">
        <p className="font-display text-lg font-black tracking-tighter text-white">EasyHire</p>
        <p className="mt-1.5 text-sm font-medium text-white/70">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs text-white/45">{sublabel}</p>}
      </div>
    </div>
  );
}
