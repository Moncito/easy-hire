import { Briefcase, CheckCircle2, CircleDashed, ShieldCheck, User, XCircle } from "lucide-react";
import type { Role, SubscriptionPlan, VerificationStatus } from "./types";

/**
 * Role/verification pills used across the directory + 360 record.
 * docs/ADMIN-CONSOLE-PLAN.md §5: "Marigold marks seeker-side, Teal marks
 * employer-side, so a directory mixing both roles is readable without a
 * legend" — Navy for ADMIN, since admin is structural, neither side.
 * Every colour is paired with an icon + text label — never colour alone
 * (§5 accessibility: "no colour-only status encoding").
 */

/**
 * `admin-dark:` overrides only where the light-mode color would otherwise
 * lose contrast on a dark surface (docs/ADMIN-UI-UPGRADE.md's dark pass) —
 * `text-teal` needs none (StatTile's own precedent: teal/marigold are
 * already high-contrast accent hues in both themes). SEEKER's light-mode
 * text is a deliberately darkened brown for readability on `bg-marigold/15`
 * against a light page, which goes muddy on a dark surface, so it swaps to
 * plain marigold; ADMIN's navy has the same problem (dark-on-dark), so it
 * swaps to the lighter navy-family blue the dashboard's own charts already
 * use for dark mode (`chartColors.ts`'s `dark.stroke`).
 */
const ROLE_STYLE: Record<Role, { label: string; icon: typeof User; className: string }> = {
  SEEKER: {
    label: "Seeker",
    icon: User,
    className:
      "bg-marigold/15 text-[#8a5a10] ring-1 ring-inset ring-marigold/30 admin-dark:bg-marigold/20 admin-dark:text-marigold admin-dark:ring-marigold/40",
  },
  EMPLOYER: {
    label: "Employer",
    icon: Briefcase,
    className: "bg-teal/10 text-teal ring-1 ring-inset ring-teal/30 admin-dark:bg-teal/15 admin-dark:ring-teal/40",
  },
  ADMIN: {
    label: "Admin",
    icon: ShieldCheck,
    className:
      "bg-navy/10 text-navy ring-1 ring-inset ring-navy/30 admin-dark:bg-white/10 admin-dark:text-[#9EB3CC] admin-dark:ring-white/20",
  },
};

export function RoleBadge({ role }: { role: Role }) {
  const s = ROLE_STYLE[role];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.className}`}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {s.label}
    </span>
  );
}

/**
 * Was defined byte-for-byte identically in `CompanyDetailView.tsx` and
 * `RoleDetailSection.tsx` (docs/ADMIN-UI-UPGRADE.md §2.4) — moved here
 * alongside `RoleBadge`, the other account-attribute badge it conceptually
 * sits next to. `SubscriptionPlan` is an exhaustive two-value union
 * ("FREE" | "PRO"), so — same as `ROLE_STYLE` above — no runtime fallback
 * is needed for an unrecognized key.
 */
const PLAN_STYLE: Record<SubscriptionPlan, string> = {
  PRO: "bg-teal/10 text-teal ring-1 ring-inset ring-teal/30 admin-dark:bg-teal/15 admin-dark:ring-teal/40",
  FREE: "bg-ink/6 text-ink/55 ring-1 ring-inset ring-ink/10 admin-dark:bg-white/10 admin-dark:text-mist/55 admin-dark:ring-white/15",
};

export function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLAN_STYLE[plan]}`}>
      {plan}
    </span>
  );
}

/** `null` = no verification concept for this account (ADMIN). Icon + text always accompany the colour. */
export function VerifiedBadge({ verified }: { verified: boolean | null }) {
  if (verified === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink/35 admin-dark:text-mist/35">
        <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        N/A
      </span>
    );
  }
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink/45 admin-dark:text-mist/45">
      <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Unverified
    </span>
  );
}

const VERIFICATION_STATUS_STYLE: Record<VerificationStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  PENDING: { label: "Pending", icon: CircleDashed, className: "text-navy/70 admin-dark:text-[#9EB3CC]" },
  APPROVED: { label: "Approved", icon: CheckCircle2, className: "text-teal" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "text-ember" },
};

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const s = VERIFICATION_STATUS_STYLE[status];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${s.className}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function TrustScoreValue({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="font-data text-xs text-ink/35 admin-dark:text-mist/35">—</span>;
  }
  const tone = score >= 75 ? "text-teal" : score >= 45 ? "text-ink/70 admin-dark:text-mist/70" : "text-ember";
  return <span className={`font-data text-xs font-semibold ${tone}`}>{score}</span>;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatMicroCentsUsd(microCents: number): string {
  // costMicroCents = 1/1,000,000 of a cent -> dollars = microCents / 1e8
  const dollars = microCents / 100_000_000;
  return dollars.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: dollars < 1 ? 4 : 2 });
}

export function titleCaseFromConstant(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
