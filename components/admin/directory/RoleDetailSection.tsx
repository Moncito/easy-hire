import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import { VerificationStatusBadge, formatMicroCentsUsd, titleCaseFromConstant } from "./badges";
import type { SerializedUserRecord } from "./types";

/**
 * The role-specific section of the 360-degree record
 * (docs/ADMIN-CONSOLE-PLAN.md §4.3). `roleDetail` is a discriminated union —
 * every arm is handled explicitly, including `INCOMPLETE` (a `SEEKER`/
 * `EMPLOYER` user whose profile/company row doesn't exist — a data-integrity
 * fault, not a normal state, so it renders as a genuine Ember warning per
 * `CLAUDE.md`'s "Ember only for genuine breaches/warnings" rule).
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

export default function RoleDetailSection({ roleDetail }: { roleDetail: SerializedUserRecord["roleDetail"] }) {
  if (roleDetail.kind === "ADMIN") {
    return (
      <section className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="flex items-center gap-2 text-sm text-ink/55">
          <ShieldCheck className="h-4 w-4 shrink-0 text-navy" aria-hidden="true" />
          Admin account — no seeker profile or company to display.
        </div>
      </section>
    );
  }

  if (roleDetail.kind === "INCOMPLETE") {
    return (
      <section className="rounded-2xl border border-ember/25 bg-ember/5 p-5">
        <div className="flex items-start gap-2 text-sm text-ember">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              Incomplete {roleDetail.role === "SEEKER" ? "seeker" : "employer"} account
            </p>
            <p className="mt-1 text-ink/70">
              This account has role {roleDetail.role} but no matching{" "}
              {roleDetail.role === "SEEKER" ? "seeker profile" : "company"} row — likely a signup that failed
              partway through. It has no profile-completion, application, or company data to show.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (roleDetail.kind === "SEEKER") {
    const statuses = Object.entries(roleDetail.applicationsByStatus) as [string, number][];
    return (
      <section aria-labelledby="role-detail-heading" className="rounded-2xl border border-ink/5 bg-white p-5">
        <h2 id="role-detail-heading" className="font-display text-lg font-bold text-ink">
          Seeker profile
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Profile complete" value={`${roleDetail.profileCompletionPercent}%`} />
          <StatTile label="Applications" value={roleDetail.totalApplications} />
          <StatTile label="Saved jobs" value={roleDetail.savedJobsCount} />
          <StatTile label="Job alerts" value={roleDetail.jobAlertsCount} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">Applications by outcome</p>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {statuses.map(([status, count]) => (
              <li key={status} className="flex items-center justify-between rounded-lg bg-mist/50 px-2.5 py-1.5 text-xs">
                <span className="text-ink/60">{titleCaseFromConstant(status)}</span>
                <span className="font-data font-semibold text-ink">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // roleDetail.kind === "EMPLOYER"
  return (
    <section aria-labelledby="role-detail-heading" className="rounded-2xl border border-ink/5 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="role-detail-heading" className="font-display text-lg font-bold text-ink">
            Employer profile
          </h2>
          <Link
            href={`/admin/companies/${roleDetail.companyId}`}
            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded"
          >
            {roleDetail.companyName}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${PLAN_STYLE[roleDetail.plan] ?? PLAN_STYLE.FREE}`}
          >
            {roleDetail.plan}
          </span>
          <VerificationStatusBadge status={roleDetail.verifiedStatus} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Jobs posted" value={roleDetail.jobsPosted} />
        <StatTile label="Approved" value={roleDetail.jobsApproved} />
        <StatTile label="Rejected" value={roleDetail.jobsRejected} />
        <StatTile label="Pending review" value={roleDetail.jobsPendingReview} />
        <StatTile label="Applications received" value={roleDetail.applicationsReceived} />
        <StatTile
          label="Response rate"
          value={
            roleDetail.responseRate !== null && roleDetail.responseSampleSize ? `${roleDetail.responseRate}%` : "—"
          }
        />
        <StatTile
          label="Median response"
          value={roleDetail.medianResponseMinutes !== null ? `${Math.round(roleDetail.medianResponseMinutes)}m` : "—"}
        />
        <StatTile
          label="AI spend"
          value={
            roleDetail.aiSpend.callCount > 0
              ? `${formatMicroCentsUsd(roleDetail.aiSpend.totalCostMicroCents)} · ${roleDetail.aiSpend.callCount} calls`
              : "—"
          }
        />
      </div>
      {roleDetail.responseRate !== null && !roleDetail.responseSampleSize && (
        <p className="mt-2 text-xs text-ink/40">Response rate not shown yet — sample size is too small to publish.</p>
      )}
    </section>
  );
}
