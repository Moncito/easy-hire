"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import TrustPanel from "./TrustPanel";
import RoleDetailSection from "./RoleDetailSection";
import ActivityTimeline from "./ActivityTimeline";
import SupportActions from "./SupportActions";
import RelativeTime from "./RelativeTime";
import { RoleBadge, formatDateTime } from "./badges";
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
}: {
  record: SerializedUserRecord;
  initialEvents: SerializedPlatformEvent[];
  initialEventsNextCursor: string | null;
}) {
  const [deletion, setDeletion] = useState<SerializedAccountDeletionResult | null>(null);

  const { identity, trust, roleDetail } = record;

  return (
    <div className="space-y-5">
      {deletion && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/25 bg-teal/5 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-ink/75">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            This account has been deleted and anonymised
            {deletion.companyAnonymized ? " (including its company)" : ""}. {deletion.jobsClosed} job
            {deletion.jobsClosed === 1 ? "" : "s"} closed, {deletion.membershipsRemoved} membership
            {deletion.membershipsRemoved === 1 ? "" : "s"} removed.
          </span>
          <Link href="/admin/users" className="font-semibold text-navy hover:underline">
            Return to directory
          </Link>
        </div>
      )}

      <div className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink">{identity.email}</h1>
              <RoleBadge role={identity.role} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
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
          <span className="shrink-0 font-data text-[11px] text-ink/35" title="User id">
            {identity.id}
          </span>
        </div>
      </div>

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

      <ActivityTimeline userId={identity.id} initialEvents={initialEvents} initialNextCursor={initialEventsNextCursor} />

      {!deletion && (
        <SupportActions
          userId={identity.id}
          email={identity.email}
          emailVerified={identity.emailVerifiedAt !== null}
          onDeleted={(result) => setDeletion(result)}
        />
      )}
    </div>
  );
}
