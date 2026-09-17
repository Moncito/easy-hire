import Link from "next/link";
import { AlertTriangle, ArrowRight, ExternalLink, FileText, ShieldCheck } from "lucide-react";
import { PlanBadge, VerificationStatusBadge, formatMicroCentsUsd, roleAccentBarClassName, titleCaseFromConstant } from "./badges";
import { StatTileCompact } from "@/components/admin/statTiles";
import type { SerializedUserRecord } from "./types";

/**
 * The role-specific section of the 360-degree record
 * (docs/ADMIN-CONSOLE-PLAN.md §4.3). `roleDetail` is a discriminated union —
 * every arm is handled explicitly, including `INCOMPLETE` (a `SEEKER`/
 * `EMPLOYER` user whose profile/company row doesn't exist — a data-integrity
 * fault, not a normal state, so it renders as a genuine Ember warning per
 * `CLAUDE.md`'s "Ember only for genuine breaches/warnings" rule).
 *
 * `variant` mirrors `TrustPanel`'s: `"card"` (default) is a standalone
 * bordered/bg-white section; `"embedded"` renders content only, for
 * `UserRecordView`'s merged Trust+Role-detail card (§ the card-density
 * pass). `INCOMPLETE` ignores `variant` and always keeps its own full Ember
 * card — a data-integrity fault deserves to stand out, not blend into a
 * neutral shared card next to an unrelated trust score.
 */

export default function RoleDetailSection({
  roleDetail,
  variant = "card",
}: {
  roleDetail: SerializedUserRecord["roleDetail"];
  variant?: "card" | "embedded";
}) {
  if (roleDetail.kind === "INCOMPLETE") {
    return (
      <section className="rounded-2xl border border-ember/25 bg-ember/5 p-5 admin-dark:border-ember/30 admin-dark:bg-ember/[0.05]">
        <div className="flex items-start gap-2 text-sm text-ember">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              Incomplete {roleDetail.role === "SEEKER" ? "seeker" : "employer"} account
            </p>
            <p className="mt-1 text-ink/70 admin-dark:text-mist/70">
              This account has role {roleDetail.role} but no matching{" "}
              {roleDetail.role === "SEEKER" ? "seeker profile" : "company"} row — likely a signup that failed
              partway through. It has no profile-completion, application, or company data to show.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (roleDetail.kind === "ADMIN") {
    const content = (
      <div className="flex items-center gap-2 text-sm text-ink/55 admin-dark:text-mist/55">
        <ShieldCheck className="h-4 w-4 shrink-0 text-navy admin-dark:text-[#9EB3CC]" aria-hidden="true" />
        Admin account — no seeker profile or company to display.
      </div>
    );
    if (variant === "embedded") return content;
    return <section className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5">{content}</section>;
  }

  const statGridClassName = variant === "embedded" ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 sm:grid-cols-4";

  if (roleDetail.kind === "SEEKER") {
    const statuses = Object.entries(roleDetail.applicationsByStatus) as [string, number][];
    const content = (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div aria-hidden="true" className={`mb-2 h-1 w-8 rounded-full ${roleAccentBarClassName("SEEKER")}`} />
            <h2 id="role-detail-heading" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
              Seeker profile
            </h2>
          </div>
          {roleDetail.resumeUrl && (
            <a
              href={roleDetail.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/15 admin-dark:text-mist/70 admin-dark:hover:bg-white/10"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              View resume
              <ExternalLink className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" />
            </a>
          )}
        </div>
        <div className={`mt-4 ${statGridClassName}`}>
          <StatTileCompact label="Profile complete" value={`${roleDetail.profileCompletionPercent}%`} />
          <StatTileCompact label="Applications" value={roleDetail.totalApplications} />
          <StatTileCompact label="Saved jobs" value={roleDetail.savedJobsCount} />
          <StatTileCompact label="Job alerts" value={roleDetail.jobAlertsCount} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">
            Applications by outcome
          </p>
          <ul className={`grid grid-cols-2 gap-2 ${variant === "embedded" ? "" : "sm:grid-cols-5"}`}>
            {statuses.map(([status, count]) => (
              <li
                key={status}
                className="flex items-center justify-between rounded-lg bg-mist/50 px-2.5 py-1.5 text-xs admin-dark:bg-white/5"
              >
                <span className="text-ink/60 admin-dark:text-mist/60">{titleCaseFromConstant(status)}</span>
                <span className="font-data font-semibold text-ink admin-dark:text-mist">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
    if (variant === "embedded") return <div role="group" aria-labelledby="role-detail-heading">{content}</div>;
    return (
      <section
        aria-labelledby="role-detail-heading"
        className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5"
      >
        {content}
      </section>
    );
  }

  // roleDetail.kind === "EMPLOYER"
  const content = (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div aria-hidden="true" className={`mb-2 h-1 w-8 rounded-full ${roleAccentBarClassName("EMPLOYER")}`} />
          <h2 id="role-detail-heading" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
            Employer profile
          </h2>
          <Link
            href={`/admin/companies/${roleDetail.companyId}`}
            className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-navy hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded admin-dark:text-teal"
          >
            {roleDetail.companyName}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <PlanBadge plan={roleDetail.plan} />
          <VerificationStatusBadge status={roleDetail.verifiedStatus} />
        </div>
      </div>

      <div className={statGridClassName}>
        <StatTileCompact label="Jobs posted" value={roleDetail.jobsPosted} />
        <StatTileCompact label="Approved" value={roleDetail.jobsApproved} />
        <StatTileCompact label="Rejected" value={roleDetail.jobsRejected} />
        <StatTileCompact label="Pending review" value={roleDetail.jobsPendingReview} />
        <StatTileCompact label="Applications received" value={roleDetail.applicationsReceived} />
        <StatTileCompact
          label="Response rate"
          value={
            roleDetail.responseRate !== null && roleDetail.responseSampleSize ? `${roleDetail.responseRate}%` : "—"
          }
        />
        <StatTileCompact
          label="Median response"
          value={roleDetail.medianResponseMinutes !== null ? `${Math.round(roleDetail.medianResponseMinutes)}m` : "—"}
        />
        <StatTileCompact
          label="AI spend"
          value={
            roleDetail.aiSpend.callCount > 0
              ? `${formatMicroCentsUsd(roleDetail.aiSpend.totalCostMicroCents)} · ${roleDetail.aiSpend.callCount} calls`
              : "—"
          }
        />
      </div>
      {roleDetail.responseRate !== null && !roleDetail.responseSampleSize && (
        <p className="mt-2 text-xs text-ink/40 admin-dark:text-mist/40">
          Response rate not shown yet — sample size is too small to publish.
        </p>
      )}
    </>
  );

  if (variant === "embedded") return <div role="group" aria-labelledby="role-detail-heading">{content}</div>;
  return (
    <section
      aria-labelledby="role-detail-heading"
      className="rounded-2xl border border-ink/5 bg-white p-5 admin-dark:border-white/10 admin-dark:bg-white/5"
    >
      {content}
    </section>
  );
}
