import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Admin-console button primitive — scoped to `/admin` only. NOT the same
 * component as `components/ui/Button.tsx` (the public-site button): that one
 * has no `admin-dark:` variants and a flatter visual language. This one is
 * deliberately "administrative-grade": layered shadows + a faint two-stop
 * gradient + an inset top highlight on solid-fill variants, so buttons read
 * as controls with actual weight rather than flat colour chips.
 *
 * Variants map 1:1 to what DecisionForm.tsx needs today:
 *  - primary      — monochrome ink/white solid. "Verify company" / "Approve"
 *                   / "Restore". Deliberately colour-neutral (ink-on-white in
 *                   light mode) rather than teal, so it no longer competes
 *                   with the one spot Ember is allowed to appear. Because
 *                   "monochrome" here means "opposite of its own surface, not
 *                   a fixed hue", this variant FLIPS between themes: ink fill
 *                   in light mode, near-white fill in `admin-dark:` (a flat
 *                   near-black button would barely read against the already
 *                   near-black admin-dark surface) — same gradient/shadow/
 *                   inset-highlight depth treatment either way, just inverted.
 *  - danger       — ember solid. The reject-confirm button only (Ember stays
 *                   reserved for genuine reject/warning actions per
 *                   CLAUDE.md). Untouched by the monochrome pass above.
 *  - secondary    — outlined neutral. Dialog "Cancel", and anywhere else a
 *                   quiet secondary action is needed. Untouched.
 *  - dangerOutline — ember-outlined ghost (tinted text/border, near-white
 *                   fill, no solid ember). The "Reject" TRIGGER only, never
 *                   the commit action — gives that trigger a visible "this is
 *                   the danger path" cue without spending Ember's one
 *                   reserved solid-fill use on it; the actual commit keeps
 *                   that solid `danger` fill.
 *
 * All colours come from the fixed brand palette (--color-teal, --color-ember,
 * --color-ink, --color-mist, --color-navy) — no new hues introduced.
 */

export type AdminButtonVariant = "primary" | "danger" | "secondary" | "dangerOutline";
export type AdminButtonSize = "sm" | "md";

const BASE =
  "relative inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl font-semibold " +
  "transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 " +
  "disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

// Solid-fill variants get: a subtle top-to-bottom gradient (own colour →
// ~8% darker), a layered shadow (tight contact shadow + soft ambient shadow
// tinted toward the button's own colour, not plain black), and a hairline
// inset top highlight for a slight bevel — all via arbitrary-value utilities
// so no new design tokens are needed.
const VARIANT_CLASSES: Record<AdminButtonVariant, string> = {
  // Light mode: ink fill, subtle lift toward white (same "own colour -> ~88%
  // toward its own darker/lighter end" technique the other solid variants
  // use, just with white as the lift target since ink has nowhere darker to
  // go that still reads as a button rather than a black hole). Dark mode
  // INVERTS the fill (near-white on near-black `admin-dark-bg`/`-surface`)
  // rather than going near-black-on-near-black — see the doc comment above.
  primary:
    "bg-[linear-gradient(to_bottom,var(--color-ink),color-mix(in_srgb,var(--color-ink)_88%,white))] " +
    "text-white " +
    "shadow-[0_1px_1px_rgba(0,0,0,0.15),0_1px_0_0_rgba(255,255,255,0.16)_inset,0_8px_16px_-6px_rgba(32,36,43,0.35)] " +
    "hover:brightness-[1.06] hover:shadow-[0_1px_1px_rgba(0,0,0,0.18),0_1px_0_0_rgba(255,255,255,0.18)_inset,0_10px_20px_-6px_rgba(32,36,43,0.4)] " +
    "focus-visible:ring-ink " +
    "admin-dark:bg-[linear-gradient(to_bottom,var(--color-mist),color-mix(in_srgb,var(--color-mist)_88%,black))] " +
    "admin-dark:text-ink " +
    "admin-dark:shadow-[0_1px_1px_rgba(0,0,0,0.5),0_1px_0_0_rgba(0,0,0,0.1)_inset,0_8px_18px_-6px_rgba(0,0,0,0.5)] " +
    "admin-dark:hover:shadow-[0_1px_1px_rgba(0,0,0,0.55),0_1px_0_0_rgba(0,0,0,0.12)_inset,0_10px_22px_-6px_rgba(0,0,0,0.55)] " +
    "admin-dark:focus-visible:ring-mist",
  danger:
    "bg-[linear-gradient(to_bottom,var(--color-ember),color-mix(in_srgb,var(--color-ember)_88%,black))] " +
    "text-white " +
    "shadow-[0_1px_1px_rgba(0,0,0,0.15),0_1px_0_0_rgba(255,255,255,0.16)_inset,0_8px_16px_-6px_rgba(217,85,58,0.55)] " +
    "hover:brightness-[1.06] hover:shadow-[0_1px_1px_rgba(0,0,0,0.18),0_1px_0_0_rgba(255,255,255,0.18)_inset,0_10px_20px_-6px_rgba(217,85,58,0.6)] " +
    "focus-visible:ring-ember " +
    "admin-dark:shadow-[0_1px_1px_rgba(0,0,0,0.4),0_1px_0_0_rgba(255,255,255,0.12)_inset,0_8px_18px_-6px_rgba(217,85,58,0.45)] " +
    "admin-dark:hover:shadow-[0_1px_1px_rgba(0,0,0,0.45),0_1px_0_0_rgba(255,255,255,0.14)_inset,0_10px_22px_-6px_rgba(217,85,58,0.5)]",
  secondary:
    "border border-ink/10 bg-white text-ink/70 shadow-[0_1px_2px_rgba(32,36,43,0.06)] " +
    "hover:bg-ink/4 hover:border-ink/15 hover:text-ink/80 " +
    "focus-visible:ring-navy " +
    "admin-dark:border-white/15 admin-dark:bg-white/[0.03] admin-dark:text-mist/70 admin-dark:shadow-none " +
    "admin-dark:hover:bg-white/8 admin-dark:hover:border-white/20 admin-dark:hover:text-mist/85",
  // Ember-outlined ghost — the Reject TRIGGER only (see doc comment above).
  // Deliberately no solid ember fill here: that stays reserved for `danger`,
  // the real reject-confirm button, per CLAUDE.md's "Ember = alerts only"
  // framed even more narrowly, "solid Ember = the actual commit only".
  dangerOutline:
    "border border-ember/25 bg-white text-ember shadow-[0_1px_2px_rgba(32,36,43,0.06)] " +
    "hover:bg-ember/5 hover:border-ember/35 " +
    "focus-visible:ring-ember " +
    "admin-dark:border-ember/30 admin-dark:bg-ember/[0.05] admin-dark:text-ember admin-dark:shadow-none " +
    "admin-dark:hover:bg-ember/10 admin-dark:hover:border-ember/40",
};

const SIZE_CLASSES: Record<AdminButtonSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  children: ReactNode;
};

const AdminButton = forwardRef<HTMLButtonElement, Props>(function AdminButton(
  { variant = "secondary", size = "md", className = "", children, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export default AdminButton;
