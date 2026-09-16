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
 *  - primary   — teal solid. "Verify company" / "Approve" / "Restore".
 *  - danger    — ember solid. The reject-confirm button only (Ember stays
 *                reserved for genuine reject/warning actions per CLAUDE.md).
 *  - secondary — outlined. "Reject" trigger / dialog "Cancel".
 *
 * All colours come from the fixed brand palette (--color-teal, --color-ember,
 * --color-ink, --color-mist, --color-navy) — no new hues introduced.
 */

export type AdminButtonVariant = "primary" | "danger" | "secondary";
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
  primary:
    "bg-[linear-gradient(to_bottom,var(--color-teal),color-mix(in_srgb,var(--color-teal)_88%,black))] " +
    "text-white " +
    "shadow-[0_1px_1px_rgba(0,0,0,0.15),0_1px_0_0_rgba(255,255,255,0.16)_inset,0_8px_16px_-6px_rgba(31,128,115,0.55)] " +
    "hover:brightness-[1.06] hover:shadow-[0_1px_1px_rgba(0,0,0,0.18),0_1px_0_0_rgba(255,255,255,0.18)_inset,0_10px_20px_-6px_rgba(31,128,115,0.6)] " +
    "focus-visible:ring-teal " +
    "admin-dark:shadow-[0_1px_1px_rgba(0,0,0,0.4),0_1px_0_0_rgba(255,255,255,0.12)_inset,0_8px_18px_-6px_rgba(31,128,115,0.45)] " +
    "admin-dark:hover:shadow-[0_1px_1px_rgba(0,0,0,0.45),0_1px_0_0_rgba(255,255,255,0.14)_inset,0_10px_22px_-6px_rgba(31,128,115,0.5)]",
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
