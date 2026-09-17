"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Globe, Mail } from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import TrustPanel from "./TrustPanel";
import {
  MemberStatusBadge,
  PlanBadge,
  VerificationStatusBadge,
  formatDate,
  formatMicroCentsUsd,
  roleAccentBarClassName,
  roleAccentCardClassName,
  roleAvatarClassName,
  titleCaseFromConstant,
} from "./badges";
import { StatTileCompact } from "@/components/admin/statTiles";
import type { SerializedCompanyDetail, SerializedCompanyDetailMember } from "./types";

/**
 * `/admin/companies/[id]` — company detail (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3 / §3): "plan, jobs, members, risk signals, AI spend." Server component
 * (see app/admin/companies/[id]/page.tsx) calls `getCompanyDetail` directly
 * and passes the result straight through — this view is presentational, no
 * client-side fetching, since `CompanyDetail` is a single-target read with
 * nothing paginated (§10: every count here is a `count`/`groupBy`/`aggregate`,
 * never a list). `"use client"` only because of the identity card's
 * copy-to-clipboard buttons (`useState`) — same reason `UserRecordView.tsx`
 * needs it.
 *
 * Card density mirrors the `UserRecordView.tsx` pass: an identity card
 * (company logo, or initials colored by the EMPLOYER accent —
 * `roleAvatarClassName`/`roleAccentCardClassName` are typed over `Role`, so
 * this page — whose subject is always EMPLOYER — passes that literal
 * throughout rather than inventing a parallel company-only helper), a merged
 * Trust + Performance card (these two "risk & health" signals travel
 * together the same way Trust + role-detail do on the user page — Jobs stays
 * separate since its own 5-column stat grid and "view in job directory" link
 * want the full row width a half-card would cramp), a Jobs card, and a
 * Members table that — like the user page's Activity list — still gets its
 * own card boundary.
 */

export default function CompanyDetailView({ detail }: { detail: SerializedCompanyDetail }) {
  const memberColumns: DataTableColumn<SerializedCompanyDetailMember>[] = [
    {
      key: "email",
      header: "Member",
      render: (m) => <span className="font-medium text-ink admin-dark:text-mist">{m.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (m) => <span className="text-ink/60 admin-dark:text-mist/60">{titleCaseFromConstant(m.role)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (m) => <MemberStatusBadge status={m.status} />,
    },
    {
      key: "joined",
      header: "Joined",
      align: "right",
      render: (m) => <span className="font-data text-xs text-ink/55 admin-dark:text-mist/55">{formatDate(m.joinedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div
        // `border-x`/`border-b` (not the blanket `border` shorthand) so the
        // dark-mode override below never touches `border-top-color` — see
        // `UserRecordView.tsx`'s identical identity-card comment for why a
        // shorthand `admin-dark:border-white/10` here would silently erase
        // the teal top edge in dark mode by stylesheet order.
        className={`rounded-2xl border-x border-b border-t-4 border-ink/5 p-5 admin-dark:border-x-white/10 admin-dark:border-b-white/10 ${roleAccentCardClassName("EMPLOYER")}`}
      >
        <div className="flex flex-wrap items-start gap-4">
          <CompanyLogoAvatar logoUrl={detail.logoUrl} companyName={detail.companyName} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink admin-dark:text-mist">
                {detail.companyName}
              </h1>
              <PlanBadge plan={detail.plan} />
              <VerificationStatusBadge status={detail.verifiedStatus} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50 admin-dark:text-mist/50">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {detail.email}
                <CopyButton value={detail.email} label="Email address" />
              </span>
              {detail.website && (
                <a
                  href={detail.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-navy hover:underline admin-dark:text-teal"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {detail.website}
                </a>
              )}
              {detail.industry && <span>{detail.industry}</span>}
              <span>Created {formatDate(detail.createdAt)}</span>
            </div>
            {detail.verificationRejectionReason && detail.verifiedStatus === "REJECTED" && (
              <p className="mt-2 rounded-lg bg-ember/8 px-3 py-2 text-xs text-ember admin-dark:bg-ember/[0.08]">
                Rejection reason: {detail.verificationRejectionReason}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink/5 pt-3 admin-dark:border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink/35 admin-dark:text-mist/35">
            Company ID
          </span>
          <span className="font-data text-[11px] text-ink/45 admin-dark:text-mist/45" title="Company id">
            {detail.companyId}
          </span>
          <CopyButton value={detail.companyId} label="Company ID" />
        </div>
      </div>

      {/* Trust and Performance always travel together as "risk & health"
          signals for this company, laid out as two columns side by side on
          wide screens — the same merged-card reasoning as the user record
          page's Trust + role-detail card. */}
      <section
        aria-label="Trust and performance"
        className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5"
      >
        <div className="grid grid-cols-1 gap-6 divide-y divide-ink/5 lg:grid-cols-2 lg:gap-8 lg:divide-y-0 lg:divide-x admin-dark:divide-white/10">
          <div className="lg:pr-8">
            <TrustPanel
              variant="embedded"
              trustScore={detail.trustScore}
              trustScoreUpdatedAt={detail.trustScoreUpdatedAt}
              trustSignals={null}
              verificationStatus={detail.verifiedStatus}
              extraRows={[
                {
                  label: "Reports against",
                  value: detail.riskSignals.reportsAgainstCount,
                  warn: detail.riskSignals.reportsAgainstCount > 0,
                },
                {
                  label: "Job rejections (90d)",
                  value: detail.riskSignals.jobRejections90dCount,
                  warn: detail.riskSignals.jobRejections90dCount > 0,
                },
              ]}
            />
          </div>
          <div className="pt-6 lg:pl-8 lg:pt-0">
            <div aria-hidden="true" className={`mb-2 h-1 w-8 rounded-full ${roleAccentBarClassName("EMPLOYER")}`} />
            <h2 id="performance-heading" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
              Performance & spend
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-labelledby="performance-heading">
              <StatTileCompact
                label="Response rate"
                value={detail.responseRate !== null && detail.responseSampleSize ? `${detail.responseRate}%` : "—"}
              />
              <StatTileCompact
                label="Median response"
                value={detail.medianResponseMinutes !== null ? `${Math.round(detail.medianResponseMinutes)}m` : "—"}
              />
              <StatTileCompact
                label="AI spend"
                value={
                  detail.aiSpend.callCount > 0
                    ? `${formatMicroCentsUsd(detail.aiSpend.totalCostMicroCents)} · ${detail.aiSpend.callCount} calls`
                    : "—"
                }
              />
            </div>
            {detail.responseRate !== null && !detail.responseSampleSize && (
              <p className="mt-2 text-xs text-ink/40 admin-dark:text-mist/40">
                Response rate not shown yet — sample size is too small to publish.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div aria-hidden="true" className={`mb-2 h-1 w-8 rounded-full ${roleAccentBarClassName("EMPLOYER")}`} />
            <h2 className="font-display text-lg font-bold text-ink admin-dark:text-mist">Jobs</h2>
          </div>
          <Link
            href={`/admin/jobs/directory?search=${encodeURIComponent(detail.companyName)}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded admin-dark:text-teal"
          >
            View in job directory
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTileCompact label="Total" value={detail.jobCounts.total} />
          <StatTileCompact label="Active" value={detail.jobCounts.active} />
          <StatTileCompact label="Pending review" value={detail.jobCounts.pendingReview} />
          <StatTileCompact label="Closed" value={detail.jobCounts.closed} />
          <StatTileCompact label="Draft" value={detail.jobCounts.draft} />
        </div>
      </section>

      <section className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5">
        {/* Navy — Members, like the user page's Activity list, is a
            role-agnostic/structural section, not employer-accent content
            (CLAUDE.md: "Harbor Navy — shared/structural"). */}
        <div aria-hidden="true" className="mb-2 h-1 w-8 rounded-full bg-navy admin-dark:bg-[#9EB3CC]" />
        <h2 className="mb-3 font-display text-lg font-bold text-ink admin-dark:text-mist">Members</h2>
        <DataTable
          columns={memberColumns}
          rows={detail.members}
          getRowId={(m) => m.id}
          caption={`Active members of ${detail.companyName}`}
          emptyState={<p className="py-8 text-center text-sm text-ink/45 admin-dark:text-mist/45">No active members.</p>}
          maxHeightClassName="max-h-[24rem]"
        />
      </section>
    </div>
  );
}

/**
 * Identity-card visual for a company: the logo is the primary visual (more
 * central to a company's identity than a generic avatar), falling back to
 * an initials tile in the EMPLOYER accent (`roleAvatarClassName`) when
 * `logoUrl` is null — the same fallback technique `UserRecordView.tsx`'s
 * `IdentityAvatar` uses, minus the personal-avatar tiers that don't apply to
 * a company. `rounded-xl` (not `-full`) for both states, since a squared
 * mark reads as a company/brand logo rather than a person, even in the
 * initials fallback case.
 */
function CompanyLogoAvatar({ logoUrl, companyName }: { logoUrl: string | null; companyName: string }) {
  if (logoUrl) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink/10 bg-white admin-dark:border-white/10 admin-dark:bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
      </div>
    );
  }

  const initial = (companyName.trim() || "?").charAt(0).toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl font-display text-xl font-bold ${roleAvatarClassName("EMPLOYER")}`}
    >
      {initial}
    </div>
  );
}

/**
 * Small copy-to-clipboard icon button for the identity card's email/company-id
 * strings — same pattern (and same `aria-live` "announce" spirit) as
 * `UserRecordView.tsx`'s local `CopyButton`. Duplicated rather than imported:
 * it's a small, presentational-only helper scoped to each page's own identity
 * card, same as that file's own comment notes for its copy of this pattern.
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
