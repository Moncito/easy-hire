import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink, Star } from "lucide-react";
import DropdownMenu, { type MenuItem } from "@/components/employer/system/DropdownMenu";
import { PipelineMini } from "@/components/employer/system/Pipeline";
import StatusBadge, { type StatusTone } from "@/components/employer/system/StatusBadge";
import { cx } from "@/components/employer/system/cx";
import type { WaitSeverity } from "@/lib/employer/attention";
import type { JobLifecycle } from "@/lib/employer/job-card-state";

type Severity = WaitSeverity;
type Pipeline = { applied: number; shortlisted: number; interview: number; hired: number };

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

const LIFECYCLE_BADGE: Record<JobLifecycle, { tone: StatusTone; label: string }> = {
  active: { tone: "success", label: "Active" },
  unlisted: { tone: "info", label: "Not public yet" },
  draft: { tone: "neutral", label: "Draft" },
  revision: { tone: "danger", label: "Needs revision" },
  pending: { tone: "info", label: "Pending review" },
  closed: { tone: "neutral", label: "Closed" },
};

/** Wait state wins over lifecycle: a live job with someone waiting says so. Icon + text, never colour alone. */
export function JobStatusBadge({ lifecycle, severity }: { lifecycle: JobLifecycle; severity: Severity }) {
  if (severity !== "none") {
    return (
      <StatusBadge tone={severity === "critical" ? "danger" : "warning"}>
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          {severity === "critical" ? "Overdue" : "Needs attention"}
        </span>
      </StatusBadge>
    );
  }
  const badge = LIFECYCLE_BADGE[lifecycle];
  return (
    <StatusBadge tone={badge.tone} dot>
      {badge.label}
    </StatusBadge>
  );
}

function Metric({ label, children, muted = false }: { label: string; children: ReactNode; muted?: boolean }) {
  return (
    // Label first in the markup (dt before dd), number first on screen.
    <div className="flex min-w-0 flex-col-reverse gap-1 px-3 py-2.5 first:pl-0">
      <dt className="text-small text-eh-muted">{label}</dt>
      <dd
        className={cx(
          "num font-heading text-[24px] font-bold leading-none tracking-[-0.02em]",
          muted ? "text-eh-muted" : "text-eh-ink"
        )}
      >
        {children}
      </dd>
    </div>
  );
}

/** Applicants | Views | Hired on a recessed panel. Only a filled role's hire count takes colour. */
function JobMetrics({ applicants, views, hired, target }: { applicants: number; views: number; hired: number; target: number }) {
  const filled = target > 0 && hired >= target;
  return (
    <dl className="grid grid-cols-3 divide-x divide-eh-line rounded-control border border-eh-line bg-eh-surface-2 px-3">
      <Metric label="Applicants" muted={applicants === 0}>
        {applicants}
      </Metric>
      <Metric label="Views">{views}</Metric>
      <Metric label="Hired">
        <span className={filled ? "text-eh-teal-ink" : undefined}>{hired}</span>
        <span className="ml-1 text-[17px] font-semibold text-eh-muted">/ {target}</span>
      </Metric>
    </dl>
  );
}

/**
 * Where applicants currently sit. Unreviewed applicants are ink, or take
 * the wait colour (marigold / Ember) when someone has waited too long;
 * progress beyond review is teal, darkening towards hired.
 */
function JobPipeline({ pipeline, applicants, severity }: { pipeline: Pipeline; applicants: number; severity: Severity }) {
  return (
    <div>
      <p className="mb-2 text-micro font-semibold uppercase tracking-[0.06em] text-eh-muted">Pipeline</p>
      {applicants > 0 ? (
        <PipelineMini
          showSummary
          className="[&>div:first-child]:h-2"
          stages={[
            {
              label: "Applied",
              value: pipeline.applied,
              tone: severity === "critical" ? "danger" : severity === "attention" ? "marigold" : "ink",
            },
            { label: "Shortlisted", value: pipeline.shortlisted, tone: "teal-soft" },
            { label: "In interview", value: pipeline.interview, tone: "teal" },
            { label: "Hired", value: pipeline.hired, tone: "teal-strong" },
          ]}
        />
      ) : (
        <>
          <div className="h-2 rounded-full bg-eh-line" aria-hidden="true" />
          <p className="mt-1.5 text-small text-eh-muted">No applicants yet</p>
        </>
      )}
    </div>
  );
}

export function JobAttentionMessage({ count, days, severity }: { count: number; days: number; severity: Severity }) {
  const critical = severity === "critical";
  return (
    <p
      className={cx(
        "num flex items-center gap-2 rounded-control border px-3 py-2 text-small font-semibold",
        critical
          ? "border-[color-mix(in_srgb,var(--eh-danger)_25%,transparent)] bg-eh-danger-tint text-eh-danger"
          : "border-[color-mix(in_srgb,var(--eh-marigold)_35%,transparent)] bg-eh-marigold-tint text-eh-marigold-ink"
      )}
    >
      {critical ? (
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {count === 1
        ? `1 applicant waiting ${plural(days, "day")}`
        : `${count} applicants waiting · oldest ${plural(days, "day")}`}
    </p>
  );
}

/**
 * One job listing, built to be scanned in a grid of six:
 *
 *   title + status        ← is it live, does it need me?
 *   where · type, salary
 *   applicants | views | hired
 *   pipeline               ← how far has hiring got?
 *   attention message      ← only when someone is waiting
 *   [ main action ] [⋯]    ← what do I do next?
 *   View listing · updated
 *
 * State is part of the component, not decoration: "attention" (3+ days
 * waiting) gets a marigold edge, tint and message; "critical" (past 14
 * days) the same in Ember — each with the real day count. Behaviour
 * (share, feature, Easy AI) is passed in, so the card works wherever a
 * listing appears.
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
  publicHref,
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
  pipeline: Pipeline;
  waiting: { count: number; days: number; severity: WaitSeverity } | null;
  /** Admin feedback, Easy AI analysis — anything the card should show inline. */
  notice?: ReactNode;
  /** One Button, size "lg" (40px) to match the menu trigger. It stretches to fill the row. */
  primaryAction: ReactNode;
  /** The public listing, shown as a quiet link in the footer when set. */
  publicHref?: string | null;
  menuItems: MenuItem[];
  /** "Updated Sep 30" */
  footnote?: string;
  loading?: boolean;
}) {
  const severity = waiting?.severity ?? "none";

  return (
    <article
      aria-label={title}
      className={cx(
        "relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-card border shadow-eh-sm transition-shadow duration-150 hover:shadow-eh-md",
        severity === "critical"
          ? "border-[color-mix(in_srgb,var(--eh-danger)_35%,var(--eh-line))] bg-[color-mix(in_srgb,var(--eh-danger)_3%,var(--eh-surface))]"
          : severity === "attention"
            ? "border-[color-mix(in_srgb,var(--eh-marigold)_50%,var(--eh-line))] bg-[color-mix(in_srgb,var(--eh-marigold)_4%,var(--eh-surface))]"
            : "border-eh-line bg-eh-surface"
      )}
    >
      {/* A 3px top edge carries the wait state at a glance across the grid. */}
      {severity !== "none" && (
        <span
          aria-hidden="true"
          className={cx("absolute inset-x-0 top-0 h-[3px]", severity === "critical" ? "bg-eh-danger" : "bg-eh-marigold")}
        />
      )}

      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[17px] font-semibold leading-snug text-eh-ink">
            <Link href={href} className="line-clamp-2 transition-colors duration-150 hover:text-eh-marigold-ink">
              {title}
            </Link>
          </h3>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <JobStatusBadge lifecycle={lifecycle} severity={severity} />
            {featured && (
              <StatusBadge tone="warning">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" strokeWidth={0} aria-hidden="true" />
                  Featured
                </span>
              </StatusBadge>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-small text-eh-muted">{meta}</p>
        {salary && <p className="mt-1 font-data text-small font-medium text-eh-ink-2">{salary}</p>}

        <div className="mt-5">
          <JobMetrics applicants={applicants} views={views} hired={hired} target={target} />
        </div>

        <div className="mt-5">
          <JobPipeline pipeline={pipeline} applicants={applicants} severity={severity} />
        </div>

        {waiting && severity !== "none" && (
          <div className="mt-4">
            <JobAttentionMessage count={waiting.count} days={waiting.days} severity={severity} />
          </div>
        )}

        {notice && <div className="mt-4">{notice}</div>}

        <div className="mt-auto flex items-center gap-2 pt-5 [&>a:first-child]:flex-1 [&>button:first-child]:flex-1">
          {primaryAction}
          <DropdownMenu
            label={`More actions for ${title}`}
            tooltip="More actions"
            triggerVariant="outline"
            triggerSize="lg"
            items={menuItems}
          />
        </div>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-3 border-t border-eh-line bg-eh-surface-2 px-5 py-2 text-small text-eh-muted">
        {publicHref ? (
          <Link
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-chip font-medium text-eh-ink-2 transition-colors duration-150 hover:text-eh-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View listing
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        ) : (
          <span />
        )}
        {footnote && <span className="text-micro">{footnote}</span>}
      </div>

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--eh-surface)_70%,transparent)]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-eh-ink border-t-transparent motion-reduce:animate-none" />
        </div>
      )}
    </article>
  );
}
