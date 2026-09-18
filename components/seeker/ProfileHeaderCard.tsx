import Image from "next/image";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { skillName } from "@/lib/seeker/profile-format";
import { formatSalaryRange } from "@/lib/format";
import type { ProfileBucketId } from "@/components/seeker/profile-buckets";

/**
 * Phase B2 — the single "this is you" moment at the top of /seeker/profile.
 *
 * Consolidates what used to be split three ways (a tiny badge in the fixed
 * nav band, the profile-strength ring inside SeekerEmployerPreview, and no
 * identity-status surface at all near the top of the page) into one card:
 * photo/name/headline, a per-section completion checklist (adapted from a
 * user-supplied redesign reference — more informative than a bare ring since
 * it says exactly what's missing), and a compact identity-status badge that
 * deep-links to IdentityVerificationPanel.
 *
 * Rebuilt as a brand-gradient hero (see the approved profile-redesign
 * mockup) — same diagonal ink→navy→teal→marigold gradient + dot-grid
 * texture + glow-circle technique as the public-profile hero band in
 * app/seekers/[id]/page.tsx, so the two "this is a person" moments in the
 * product read as one family.
 */

export type IdVerificationStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export type HeroBucketStatus = {
  id: ProfileBucketId;
  label: string;
  complete: boolean;
};

type Props = {
  fullName: string;
  headline: string | null;
  photoUrl: string | null;
  location?: string | null;
  bio?: string | null;
  yearsExperience?: string | null;
  availability?: string | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  completed: number;
  total: number;
  idVerificationStatus: IdVerificationStatus;
  skills?: string[];
  bucketStatus: HeroBucketStatus[];
  publicProfileHref: string;
};

const MAX_HERO_SKILLS = 4;

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
  location,
  bio,
  yearsExperience,
  availability,
  desiredSalaryMin,
  desiredSalaryMax,
  completed,
  total,
  idVerificationStatus,
  skills = [],
  bucketStatus,
  publicProfileHref,
}: Props) {
  const visibleSkills = skills.slice(0, MAX_HERO_SKILLS).map(skillName);
  const extraSkillCount = Math.max(0, skills.length - MAX_HERO_SKILLS);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = total > 0 && completed >= total;
  const hasSalary = desiredSalaryMin != null || desiredSalaryMax != null;
  const quickFacts = [
    yearsExperience ? { icon: Clock, label: yearsExperience } : null,
    availability ? { icon: Briefcase, label: availability } : null,
    hasSalary ? { icon: Wallet, label: formatSalaryRange(desiredSalaryMin, desiredSalaryMax) } : null,
  ].filter((f): f is { icon: typeof Clock; label: string } => f !== null);

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

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={72}
              height={72}
              className="h-16 w-16 shrink-0 rounded-full border-[3px] border-white/85 object-cover sm:h-[72px] sm:w-[72px]"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-white/85 bg-white/15 font-display text-xl font-bold text-white backdrop-blur sm:h-[72px] sm:w-[72px] sm:text-2xl">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold text-white sm:text-2xl lg:text-[28px]">
              {fullName || "Your name"}
            </p>
            <p className="mt-1.5 truncate text-sm font-medium text-white/75">
              {headline || "Add a headline to introduce yourself"}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <a
                href="#identity-verification"
                aria-label={`Identity verification status: ${badge.label}. Jump to identity verification section.`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur transition-opacity hover:opacity-85 ${badge.pillClassName}`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${badge.dotClassName}`} aria-hidden="true" />
                <BadgeIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>Identity: {badge.label}</span>
              </a>
              {location?.trim() && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-white/70">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                  {location}
                </span>
              )}
            </div>

            {bio?.trim() && (
              <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70">{bio}</p>
            )}

            {quickFacts.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {quickFacts.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {label}
                  </span>
                ))}
              </div>
            )}

            {visibleSkills.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {visibleSkills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur"
                  >
                    {skill}
                  </span>
                ))}
                {extraSkillCount > 0 && (
                  <span className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/70 backdrop-blur">
                    +{extraSkillCount}
                  </span>
                )}
              </div>
            )}

            <a
              href={publicProfileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Preview public profile
            </a>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5 lg:w-[280px]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Profile strength</p>
          </div>
          <p className="mt-1 font-data text-2xl font-bold text-white">{pct}% complete</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-marigold transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          {isComplete ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-marigold/30 bg-marigold/15 px-3 py-2.5">
              <Sparkles className="h-4 w-4 shrink-0 text-marigold" aria-hidden="true" />
              <span className="text-xs font-medium text-white/90">All sections complete — nice work.</span>
            </div>
          ) : (
            <ul className="mt-4 space-y-2" aria-label="Profile section completion">
              {bucketStatus.map((b) => (
                <li key={b.id} className="flex items-center gap-2 text-xs">
                  {b.complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-marigold" aria-hidden="true" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-white/30" aria-hidden="true" />
                  )}
                  <span className={b.complete ? "text-white/90" : "text-white/50"}>{b.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
