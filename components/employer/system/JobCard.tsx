import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { Card } from "@/components/employer/system/Card";
import DropdownMenu, { type MenuItem } from "@/components/employer/system/DropdownMenu";
import { PipelineMini } from "@/components/employer/system/Pipeline";
import StatusBadge, { type StatusTone } from "@/components/employer/system/StatusBadge";
import { cx } from "@/components/employer/system/cx";
import type { WaitSeverity } from "@/lib/employer/attention";
import type { JobLifecycle } from "@/lib/employer/job-card-state";

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Only exceptions get a badge; a healthy active listing has none. */
const LIFECYCLE_BADGE: Partial<Record<JobLifecycle, { tone: StatusTone; label: string }>> = {
  unlisted: { tone: "info", label: "Not public yet" },
  draft: { tone: "neutral", label: "Draft" },
  revision: { tone: "danger", label: "Needs revision" },
  pending: { tone: "info", label: "Pending review" },
  closed: { tone: "neutral", label: "Closed" },
};

function Metric({ label, children }: { label: string; children: ReactNode }) {
  return (
    // Label first in the markup (dt before dd), number first on screen.
    <div className="flex min-w-0 flex-col-reverse gap-1.5">
      <dt className="text-small text-eh-muted">{label}</dt>
      <dd className="num font-heading text-[22px] font-semibold leading-none text-eh-ink">{children}</dd>
    </div>
  );
}

/**
 * One job listing, in four layers of decreasing weight: identity (title,
 * where, pay) → hiring numbers → pipeline → the single main action. Every
 * other action lives in the "⋯" menu.
 *
 * State drives the look, not decoration:
 *  - waiting severity "attention" (3+ days) tints the border marigold and
 *    says how long; "critical" (past 14) does the same in Ember.
 *  - lifecycle adds a badge only when it isn't a normal live listing.
 *  - `featured` adds a Featured badge.
 * Behaviour (sharing, featuring, Easy AI) is passed in, so the card works
 * wherever a listing appears.
 */
export default function JobCard({
  title,
  href,
  meta,
  salary,
  lifecycle,
  featured = false,
  applicants,
  views,
  hired,
  target,
  pipeline,
  waiting,
  notice,
  primaryAction,
  menuItems,
  footnote,
  loading = false,
}: {
  title: string;
  /** Where the title goes — same place as the main action. */
  href: string;
  /** "Remote · Manila, Philippines · Full-time" */
  meta: string;
  salary?: string | null;
  lifecycle: JobLifecycle;
  featured?: boolean;
  applicants: number;
  views: number;
  hired: number;
  target: number;
  pipeline: { applied: number; shortlisted: number; interview: number; hired: number };
  waiting: { count: number; days: number; severity: WaitSeverity } | null;
  /** Admin feedback, Easy AI tips — anything the card should show inline. */
  notice?: ReactNode;
  /** One Button, full width. */
  primaryAction: ReactNode;
  menuItems: MenuItem[];
  /** "Updated Sep 30" */
  footnote?: string;
  loading?: boolean;
}) {
  const severity = waiting?.severity ?? "none";
  const badge = LIFECYCLE_BADGE[lifecycle];
  const hasApplicants = applicants > 0;

  return (
    <Card
      as="article"
      padded={false}
      tone={severity === "none" ? "default" : severity}
      aria-label={title}
      className="relative flex h-full flex-col p-5 transition-shadow duration-150 hover:shadow-eh-md"
    >
      {(badge || featured || severity !== "none") && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {severity === "critical" && <StatusBadge tone="danger">Overdue review</StatusBadge>}
          {severity === "attention" && <StatusBadge tone="warning">Needs attention</StatusBadge>}
          {badge && <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>}
          {featured && (
            <StatusBadge tone="warning">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" strokeWidth={0} aria-hidden="true" />
                Featured
              </span>
            </StatusBadge>
          )}
        </div>
      )}

      <h3 className="text-[17px] font-semibold leading-snug text-eh-ink">
        <Link href={href} className="line-clamp-2 transition-colors duration-150 hover:text-eh-marigold-ink">
          {title}
        </Link>
      </h3>
      <p className="mt-1 text-small text-eh-muted">{meta}</p>
      {salary && <p className="mt-0.5 font-data text-small text-eh-ink-2">{salary}</p>}

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-eh-line pt-4">
        <Metric label="Applicants">{applicants}</Metric>
        <Metric label="Views">{views}</Metric>
        <Metric label="Hired">
          {hired}
          <span className="text-body font-normal text-eh-muted">/{target}</span>
        </Metric>
      </dl>

      <div className="mt-4">
        {hasApplicants ? (
          <PipelineMini
            showSummary
            stages={[
              { label: "Applied", value: pipeline.applied, tone: "muted" },
              { label: "Shortlisted", value: pipeline.shortlisted, tone: "ink" },
              { label: "In interview", value: pipeline.interview, tone: "teal" },
              { label: "Hired", value: pipeline.hired, tone: "marigold" },
            ]}
          />
        ) : (
          <p className="text-small text-eh-muted">No applicants yet</p>
        )}
      </div>

      {waiting && severity !== "none" && (
        <p
          className={cx(
            "num mt-3 inline-flex items-center gap-1.5 text-small font-semibold",
            severity === "critical" ? "text-eh-danger" : "text-eh-marigold-ink"
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {plural(waiting.count, "applicant")} waiting · oldest {plural(waiting.days, "day")}
        </p>
      )}

      {notice && <div className="mt-3">{notice}</div>}

      <div className="mt-auto pt-5">
        <div className="flex items-center gap-2 [&>a]:flex-1 [&>button:first-child]:flex-1">
          {primaryAction}
          <DropdownMenu label={`More actions for ${title}`} items={menuItems} />
        </div>
        {footnote && <p className="mt-2.5 text-micro text-eh-muted">{footnote}</p>}
      </div>

      {loading && (
        <div className="absolute inset-0 grid place-items-center rounded-card bg-[color-mix(in_srgb,var(--eh-surface)_70%,transparent)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-eh-ink border-t-transparent motion-reduce:animate-none" />
        </div>
      )}
    </Card>
  );
}
