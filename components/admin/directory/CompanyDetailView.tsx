import Link from "next/link";
import { ArrowRight, Globe, Mail } from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import TrustPanel from "./TrustPanel";
import { VerificationStatusBadge, formatDate, formatMicroCentsUsd, titleCaseFromConstant } from "./badges";
import type { SerializedCompanyDetail, SerializedCompanyDetailMember } from "./types";

/**
 * `/admin/companies/[id]` — company detail (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3 / §3): "plan, jobs, members, risk signals, AI spend." Server component
 * (see app/admin/companies/[id]/page.tsx) calls `getCompanyDetail` directly
 * and passes the result straight through — this view is presentational, no
 * client-side fetching, since `CompanyDetail` is a single-target read with
 * nothing paginated (§10: every count here is a `count`/`groupBy`/`aggregate`,
 * never a list).
 */

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-mist/60 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{label}</p>
      <p className="mt-0.5 font-data text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

const PLAN_STYLE: Record<string, string> = {
  PRO: "bg-teal/10 text-teal ring-1 ring-inset ring-teal/30",
  FREE: "bg-ink/6 text-ink/55 ring-1 ring-inset ring-ink/10",
};

const MEMBER_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "text-teal",
  PENDING: "text-navy/70",
  REMOVED: "text-ink/40",
};

export default function CompanyDetailView({ detail }: { detail: SerializedCompanyDetail }) {
  const memberColumns: DataTableColumn<SerializedCompanyDetailMember>[] = [
    {
      key: "email",
      header: "Member",
      render: (m) => <span className="font-medium text-ink">{m.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (m) => <span className="text-ink/60">{titleCaseFromConstant(m.role)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (m) => (
        <span className={`text-xs font-semibold ${MEMBER_STATUS_STYLE[m.status] ?? "text-ink/50"}`}>
          {titleCaseFromConstant(m.status)}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      align: "right",
      render: (m) => <span className="font-data text-xs text-ink/55">{formatDate(m.joinedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink">{detail.companyName}</h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLAN_STYLE[detail.plan] ?? PLAN_STYLE.FREE}`}
              >
                {detail.plan}
              </span>
              <VerificationStatusBadge status={detail.verifiedStatus} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {detail.email}
              </span>
              {detail.website && (
                <a
                  href={detail.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-navy hover:underline"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {detail.website}
                </a>
              )}
              {detail.industry && <span>{detail.industry}</span>}
              <span>Created {formatDate(detail.createdAt)}</span>
            </div>
            {detail.verificationRejectionReason && detail.verifiedStatus === "REJECTED" && (
              <p className="mt-2 rounded-lg bg-ember/8 px-3 py-2 text-xs text-ember">
                Rejection reason: {detail.verificationRejectionReason}
              </p>
            )}
          </div>
          <span className="shrink-0 font-data text-[11px] text-ink/35" title="Company id">
            {detail.companyId}
          </span>
        </div>
      </div>

      <TrustPanel
        trustScore={detail.trustScore}
        trustScoreUpdatedAt={detail.trustScoreUpdatedAt}
        trustSignals={null}
        verificationStatus={detail.verifiedStatus}
        extraRows={[
          { label: "Reports against", value: detail.riskSignals.reportsAgainstCount, warn: detail.riskSignals.reportsAgainstCount > 0 },
          {
            label: "Job rejections (90d)",
            value: detail.riskSignals.jobRejections90dCount,
            warn: detail.riskSignals.jobRejections90dCount > 0,
          },
        ]}
      />

      <section className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Jobs</h2>
          <Link
            href={`/admin/jobs/directory?search=${encodeURIComponent(detail.companyName)}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded"
          >
            View in job directory
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Total" value={detail.jobCounts.total} />
          <StatTile label="Active" value={detail.jobCounts.active} />
          <StatTile label="Pending review" value={detail.jobCounts.pendingReview} />
          <StatTile label="Closed" value={detail.jobCounts.closed} />
          <StatTile label="Draft" value={detail.jobCounts.draft} />
        </div>
      </section>

      <section className="rounded-2xl border border-ink/5 bg-white p-5">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Performance & spend</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="Response rate"
            value={detail.responseRate !== null && detail.responseSampleSize ? `${detail.responseRate}%` : "—"}
          />
          <StatTile
            label="Median response"
            value={detail.medianResponseMinutes !== null ? `${Math.round(detail.medianResponseMinutes)}m` : "—"}
          />
          <StatTile
            label="AI spend"
            value={
              detail.aiSpend.callCount > 0
                ? `${formatMicroCentsUsd(detail.aiSpend.totalCostMicroCents)} · ${detail.aiSpend.callCount} calls`
                : "—"
            }
          />
        </div>
        {detail.responseRate !== null && !detail.responseSampleSize && (
          <p className="mt-2 text-xs text-ink/40">Response rate not shown yet — sample size is too small to publish.</p>
        )}
      </section>

      <section className="rounded-2xl border border-ink/5 bg-white p-5">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Members</h2>
        <DataTable
          columns={memberColumns}
          rows={detail.members}
          getRowId={(m) => m.id}
          caption={`Active members of ${detail.companyName}`}
          emptyState={<p className="py-8 text-center text-sm text-ink/45">No active members.</p>}
          maxHeightClassName="max-h-[24rem]"
        />
      </section>
    </div>
  );
}
