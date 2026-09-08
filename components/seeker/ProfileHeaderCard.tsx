import Image from "next/image";
import { AlertCircle, Clock, Shield, ShieldCheck } from "lucide-react";

/**
 * Phase B2 — the single "this is you" moment at the top of /seeker/profile.
 *
 * Consolidates what used to be split three ways (a tiny badge in the fixed
 * nav band, the profile-strength ring inside SeekerEmployerPreview, and no
 * identity-status surface at all near the top of the page) into one card:
 * photo/name/headline, the *only* profile-strength ring left on this page
 * (adapted from SeekerEmployerPreview's former ring — see git history), and
 * a compact identity-status badge that deep-links to IdentityVerificationPanel.
 *
 * Rebuilt as a brand-gradient hero (see the approved profile-redesign
 * mockup) — same diagonal ink→navy→teal→marigold gradient + dot-grid
 * texture + glow-circle technique as the public-profile hero band in
 * app/seekers/[id]/page.tsx, so the two "this is a person" moments in the
 * product read as one family.
 */

export type IdVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

type Props = {
  fullName: string;
  headline: string | null;
  photoUrl: string | null;
  completed: number;
  total: number;
  idVerificationStatus: IdVerificationStatus;
};

type IdentityBadgeKey = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

/**
 * Glass-pill treatment on the dark hero replaces the old tinted-by-status
 * background, but the status signal itself can't be lost — a REJECTED badge
 * in particular must not read the same as a healthy one at a glance. Each
 * status keeps the same glass base (border-white/35 bg-white/15) except
 * VERIFIED (teal-tinted) and REJECTED (ember-tinted, the one legitimate
 * Ember use on this page), and every status also carries a small colored
 * dot indicator as a second, non-text signal.
 */
const IDENTITY_BADGE: Record<
  IdentityBadgeKey,
  { label: string; icon: typeof Shield; pillClassName: string; dotClassName: string }
> = {
  UNVERIFIED: {
    label: "Unverified",
    icon: Shield,
    pillClassName: "border-white/35 bg-white/15 text-white",
    dotClassName: "bg-white/50",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    pillClassName: "border-white/35 bg-white/15 text-white",
    dotClassName: "bg-white",
  },
  VERIFIED: {
    label: "Verified",
    icon: ShieldCheck,
    pillClassName: "border-teal/45 bg-teal/20 text-white",
    dotClassName: "bg-teal",
  },
  REJECTED: {
    label: "Attention needed",
    icon: AlertCircle,
    pillClassName: "border-ember/50 bg-ember/25 text-white",
    dotClassName: "bg-ember",
  },
};

function identityBadgeKey(status: IdVerificationStatus): IdentityBadgeKey {
  if (status === "APPROVED") return "VERIFIED";
  if (status === "PENDING") return "PENDING";
  if (status === "REJECTED") return "REJECTED";
  return "UNVERIFIED";
}

export default function ProfileHeaderCard({
  fullName,
  headline,
  photoUrl,
  completed,
  total,
  idVerificationStatus,
}: Props) {
  const initials =
    fullName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VA";

  const badge = IDENTITY_BADGE[identityBadgeKey(idVerificationStatus)];
  const BadgeIcon = badge.icon;
  const strengthDeg = total > 0 ? (completed / total) * 360 : 0;

  return (
    <div className="animate-fade-in relative mb-6 overflow-hidden rounded-[28px] bg-[linear-gradient(120deg,var(--color-ink)_0%,var(--color-navy)_34%,var(--color-teal)_70%,var(--color-marigold)_100%)] p-6 shadow-[0_24px_60px_-20px_rgba(30,58,95,0.35)] sm:p-8 lg:mb-8 lg:p-11">
      {/* dot-grid texture, matches app/seekers/[id]/page.tsx's public hero */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 -top-32 h-[280px] w-[280px] rounded-full bg-marigold/30 blur-[60px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 left-[22%] h-[220px] w-[220px] rounded-full bg-teal/35 blur-[50px]"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-2xl border-[3px] border-white/85 object-cover sm:h-[72px] sm:w-[72px]"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-[3px] border-white/85 bg-white/15 font-display text-xl font-bold text-white backdrop-blur sm:h-[72px] sm:w-[72px] sm:text-2xl">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold text-white sm:text-2xl lg:text-[28px]">
              {fullName || "Your name"}
            </p>
            <p className="mt-1.5 truncate text-sm font-medium text-white/75">
              {headline || "Add a headline to introduce yourself"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-5 sm:gap-7">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#F2A93B ${strengthDeg}deg, rgba(255,255,255,0.22) 0deg)`,
            }}
            role="img"
            aria-label={`Profile strength: ${completed} of ${total} sections complete`}
          >
            <span
              aria-hidden="true"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/55 font-data text-xs font-bold text-white backdrop-blur-sm"
            >
              {completed}/{total}
            </span>
          </div>

          <a
            href="#identity-verification"
            aria-label={`Identity verification status: ${badge.label}. Jump to identity verification section.`}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold backdrop-blur transition-opacity hover:opacity-85 ${badge.pillClassName}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${badge.dotClassName}`} aria-hidden="true" />
            <BadgeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Identity: {badge.label}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
