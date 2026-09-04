import { Shield, ShieldCheck } from "lucide-react";
import type { VerificationTier } from "@/lib/seeker/verification-score";

/**
 * Phase 4.2 — compact, presentational badge for the VA "identity
 * confidence" score.
 *
 * COPY RULE (non-negotiable, see lib/seeker/verification-score.ts's doc
 * comment): this score measures identity confidence — how sure we are the
 * person is real and reachable — never skill, work quality, or reliability.
 * The qualifier below must always ride along with the number/tier, either
 * visibly (larger placements) or via `aria-label` + `title` (compact
 * placements).
 *
 * A low/UNVERIFIED score is not a rejection, so it is never painted Ember —
 * only a genuine REJECTED identity-review outcome gets that color, and only
 * inside IdentityVerificationPanel, not here.
 */

export const VERIFICATION_QUALIFIER =
  "Identity confidence — how sure we are this is a real, reachable person. Not a measure of skill.";

const TIER_LABEL: Record<VerificationTier, string> = {
  UNVERIFIED: "Unverified",
  BASIC: "Basic",
  STRONG: "Strong",
  TRUSTED: "Trusted",
};

export type VerificationBadgeProps = {
  score: number;
  tier: VerificationTier;
  idVerifiedAt: string | Date | null;
  size?: "sm" | "md";
  /** Seeker-facing surfaces use Marigold, employer-facing surfaces use Signal Teal. */
  accent?: "seeker" | "employer";
  className?: string;
};

function tierClasses(tier: VerificationTier, accent: "seeker" | "employer"): string {
  if (tier === "TRUSTED") {
    return accent === "employer"
      ? "border-teal/25 bg-teal/10 text-teal"
      : "border-marigold/30 bg-marigold/12 text-[#8a5a10]";
  }
  if (tier === "STRONG") {
    return "border-navy/20 bg-navy/8 text-navy";
  }
  if (tier === "BASIC") {
    return "border-ink/12 bg-ink/6 text-ink/60";
  }
  // UNVERIFIED — neutral/muted, never Ember: this is not a rejection state.
  return "border-ink/10 bg-ink/5 text-ink/40";
}

function formatVerifiedDate(value: string | Date | null): string | null {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function VerificationBadge({
  score,
  tier,
  idVerifiedAt,
  size = "sm",
  accent = "seeker",
  className = "",
}: VerificationBadgeProps) {
  const label = TIER_LABEL[tier];
  const verifiedDate = formatVerifiedDate(idVerifiedAt);
  const qualifierWithDate = verifiedDate
    ? `${VERIFICATION_QUALIFIER} Identity document approved ${verifiedDate}.`
    : VERIFICATION_QUALIFIER;
  const ariaLabel = `Identity confidence: ${label}, ${score} out of 100. ${qualifierWithDate}`;

  const Icon = tier === "TRUSTED" || tier === "STRONG" ? ShieldCheck : Shield;
  const sizeClasses =
    size === "md"
      ? "gap-1.5 rounded-xl px-3 py-1.5 text-xs"
      : "gap-1 rounded-full px-2.5 py-1 text-[11px]";

  return (
    <span
      aria-label={ariaLabel}
      title={qualifierWithDate}
      className={`inline-flex items-center border font-semibold leading-none ${sizeClasses} ${tierClasses(
        tier,
        accent
      )} ${className}`}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5 shrink-0" : "h-3 w-3 shrink-0"} aria-hidden="true" />
      <span>{label}</span>
      <span className="font-data tabular-nums opacity-70">{score}</span>
    </span>
  );
}
