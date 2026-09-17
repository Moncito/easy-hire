"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, Mail } from "lucide-react";
import TrustPanel from "./TrustPanel";
import RoleDetailSection from "./RoleDetailSection";
import ActivityTimeline from "./ActivityTimeline";
import SupportActions from "./SupportActions";
import RelativeTime from "./RelativeTime";
import { RoleBadge, formatDateTime, roleAccentCardClassName, roleAvatarClassName } from "./badges";
import type { SerializedAccountDeletionResult, SerializedPlatformEvent, SerializedUserRecord } from "./types";

/**
 * `/admin/users/[id]` — the 360-degree record (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3): "The page you open when someone emails support. Everything about
 * one person, one screen." Composes identity, the trust panel, the
 * role-specific section, the activity timeline, and support actions —
 * everything the Phase 2 gate ("any support question answerable from one
 * screen without opening Prisma Studio") needs.
 *
 * `record` and `initialEvents` are the server-rendered first read (§5:
 * "Server components for reads") — this shell never re-fetches the record
 * itself (it isn't paginated; a hard refresh is the only way to see fresh
 * identity/trust/role data, same as the rest of this console's single-target
 * reads). Only the activity timeline re-fetches, via ActivityTimeline's own
 * filter/infinite-scroll logic.
 */
export default function UserRecordView({
  record,
  initialEvents,
  initialEventsNextCursor,
  canImpersonate,
}: {
  record: SerializedUserRecord;
  initialEvents: SerializedPlatformEvent[];
  initialEventsNextCursor: string | null;
  /** `hasPermission(ctx.access, "impersonate")`, resolved once by the server component — see SupportActions's own doc comment. */
  canImpersonate: boolean;
}) {
  const [deletion, setDeletion] = useState<SerializedAccountDeletionResult | null>(null);

  const { identity, trust, roleDetail } = record;

  return (
    <div className="space-y-5">
      {deletion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/25 bg-teal/5 px-4 py-3 text-sm admin-dark:border-teal/30 admin-dark:bg-teal/10">
          <span className="flex items-center gap-2 text-ink/75 admin-dark:text-mist/75">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            This account has been deleted and anonymised
            {deletion.companyAnonymized ? " (including its company)" : ""}. {deletion.jobsClosed} job
            {deletion.jobsClosed === 1 ? "" : "s"} closed, {deletion.membershipsRemoved} membership
            {deletion.membershipsRemoved === 1 ? "" : "s"} removed.
          </span>
          <Link href="/admin/users" className="font-semibold text-navy hover:underline admin-dark:text-teal">
            Return to directory
          </Link>
        </div>
      )}

      <div
        // `border-x`/`border-b` (not the blanket `border` shorthand) so the
        // dark-mode override below never touches `border-top-color` — a
        // shorthand `admin-dark:border-white/10` here would compile to the
        // same `border-top-color` longhand as `roleAccentCardClassName`'s
        // `border-t-{role}` and silently win in dark mode by stylesheet
        // order (Tailwind emits variant utilities after their plain
        // counterparts), erasing the role-accent top edge exactly when it's
        // needed to stay visible against the dark surface.
        className={`rounded-2xl border-x border-b border-t-4 border-ink/5 p-5 admin-dark:border-x-white/10 admin-dark:border-b-white/10 ${roleAccentCardClassName(identity.role)}`}
      >
        <div className="flex flex-wrap items-start gap-4">
          <IdentityAvatar identity={identity} roleDetail={roleDetail} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink admin-dark:text-mist">
                {identity.email}
              </h1>
              <CopyButton value={identity.email} label="Email address" />
              <RoleBadge role={identity.role} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50 admin-dark:text-mist/50">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {identity.emailVerifiedAt ? `Verified ${formatDateTime(identity.emailVerifiedAt)}` : "Email not verified"}
              </span>
              <span>
                Signed up <RelativeTime iso={identity.createdAt} />
              </span>
              <span>
                Last seen <RelativeTime iso={identity.lastSeenAt} />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink/5 pt-3 admin-dark:border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink/35 admin-dark:text-mist/35">
            User ID
          </span>
          <span className="font-data text-[11px] text-ink/45 admin-dark:text-mist/45" title="User id">
            {identity.id}
          </span>
          <CopyButton value={identity.id} label="User ID" />
        </div>
      </div>

      {roleDetail.kind === "INCOMPLETE" ? (
        // A data-integrity fault stands alone — see RoleDetailSection's own
        // doc comment for why this one case skips the merged card below.
        <>
          <TrustPanel
            trustScore={trust.trustScore}
            trustScoreUpdatedAt={trust.trustScoreUpdatedAt}
            trustSignals={trust.trustSignals}
            verificationStatus={trust.verificationStatus}
            extraRows={[
              { label: "Reports against", value: trust.reportsAgainstCount, warn: trust.reportsAgainstCount > 0 },
              { label: "Reports filed", value: trust.reportsFiledCount },
            ]}
          />
          <RoleDetailSection roleDetail={roleDetail} />
        </>
      ) : (
        // Trust and the role-specific detail always travel together and
        // neither needs its own visual isolation from the other — one card,
        // laid out as two columns side by side on wide screens (using the
        // horizontal room a single narrow stacked card was wasting) with a
        // divider between them, stacking with a horizontal divider on
        // narrow viewports.
        <section
          aria-label="Trust and role detail"
          className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5"
        >
          <div className="grid grid-cols-1 gap-6 divide-y divide-ink/5 lg:grid-cols-2 lg:gap-8 lg:divide-y-0 lg:divide-x admin-dark:divide-white/10">
            <div className="lg:pr-8">
              <TrustPanel
                variant="embedded"
                trustScore={trust.trustScore}
                trustScoreUpdatedAt={trust.trustScoreUpdatedAt}
                trustSignals={trust.trustSignals}
                verificationStatus={trust.verificationStatus}
                extraRows={[
                  { label: "Reports against", value: trust.reportsAgainstCount, warn: trust.reportsAgainstCount > 0 },
                  { label: "Reports filed", value: trust.reportsFiledCount },
                ]}
              />
            </div>
            <div className="pt-6 lg:pl-8 lg:pt-0">
              <RoleDetailSection variant="embedded" roleDetail={roleDetail} />
            </div>
          </div>
        </section>
      )}

      <ActivityTimeline userId={identity.id} initialEvents={initialEvents} initialNextCursor={initialEventsNextCursor} />

      {!deletion && (
        <SupportActions
          userId={identity.id}
          email={identity.email}
          emailVerified={identity.emailVerifiedAt !== null}
          targetRole={identity.role}
          canImpersonate={canImpersonate}
          onDeleted={(result) => setDeletion(result)}
        />
      )}
    </div>
  );
}

/**
 * Identity-card avatar. Priority order:
 *  - EMPLOYER accounts show their company logo first — a company record is
 *    better represented by its own logo than by whatever personal Google
 *    avatar the signed-in contact happens to have.
 *  - Otherwise, `identity.avatarUrl` (Google OAuth) if present.
 *  - SEEKER accounts fall back further to their profile photo.
 *  - Failing all of that, a generated initials avatar colored by role via
 *    `roleAvatarClassName` — the SAME accent mapping `RoleBadge` uses.
 *
 * Plain `<img>` rather than `next/image`: `roleDetail.logoUrl`/`photoUrl` are
 * Supabase Storage URLs (already whitelisted in `next.config.ts`), but
 * `identity.avatarUrl` is a Google-hosted URL that ISN'T, and never needs to
 * be — this mirrors the existing plain-`<img>` precedent for logos on the
 * public `/companies/[id]` page rather than introducing a second image
 * pipeline just for this card.
 */
function IdentityAvatar({
  identity,
  roleDetail,
}: {
  identity: SerializedUserRecord["identity"];
  roleDetail: SerializedUserRecord["roleDetail"];
}) {
  const employerLogoUrl = roleDetail.kind === "EMPLOYER" ? roleDetail.logoUrl : null;
  const seekerPhotoUrl = roleDetail.kind === "SEEKER" ? roleDetail.photoUrl : null;

  if (employerLogoUrl) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink/10 bg-white admin-dark:border-white/10 admin-dark:bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={employerLogoUrl} alt="" className="h-full w-full object-contain p-1.5" />
      </div>
    );
  }

  const personalImageUrl = identity.avatarUrl ?? seekerPhotoUrl;
  if (personalImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={personalImageUrl}
        alt=""
        className="h-16 w-16 shrink-0 rounded-full border border-ink/10 object-cover admin-dark:border-white/10"
      />
    );
  }

  const name = roleDetail.kind === "SEEKER" ? roleDetail.fullName : roleDetail.kind === "EMPLOYER" ? roleDetail.companyName : null;
  const initial = (name?.trim() || identity.email).charAt(0).toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold ${roleAvatarClassName(identity.role)}`}
    >
      {initial}
    </div>
  );
}

/**
 * Small copy-to-clipboard icon button for the identity card's email/user-id
 * strings — previously plain unselectable-without-triple-click text. Same
 * `aria-live` "announce" spirit as `SupportActions.tsx`'s confirmation
 * pattern, scoped locally since there's nothing else on this card to
 * coordinate it with.
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied/unavailable in this browser — the value
      // is still visible as plain text, so there's nothing else to do here.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleCopy()}
        aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink/35 transition-colors hover:bg-ink/5 hover:text-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:text-mist/35 admin-dark:hover:bg-white/10 admin-dark:hover:text-mist/80"
      >
        {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
      </button>
      <span aria-live="polite" role="status" className="sr-only">
        {copied ? `${label} copied to clipboard` : ""}
      </span>
    </>
  );
}
