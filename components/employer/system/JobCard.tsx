import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink, Star } from "lucide-react";
import DropdownMenu, { type MenuItem } from "@/components/employer/system/DropdownMenu";
import { PipelineMini } from "@/components/employer/system/Pipeline";
import StatusBadge, { type StatusTone } from "@/components/employer/system/StatusBadge";
import { cx } from "@/components/employer/system/cx";
import type { WaitSeverity } from "@/lib/employer/attention";
import type { JobLifecycle } from "@/lib/employer/job-card-state";

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

/**
 * One job listing, built to be scanned in a grid of six:
 *
 *   title + status        ← is it live, does it need me?
 *   where · type, salary
 *   applicants | views | hired
 *   pipeline               ← how far has hiring got?
 *   attention message      ← only when someone is waiting
 *   [ main action ] ⋯      ← what do I do next?
 *   View listing · updated
 *
 * State is part of the component, not decoration: "attention" (3+ days
 * waiting) gets a marigold edge and message, "critical" (past 14 days) the
 * same in Ember, each with the real day count. Behaviour (share, feature,
 * Easy AI) is passed in, so the card works wherever a listing appears.
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
  pipeline: { applied: number; shortlisted: number; interview: number; hired: number };
  waiting: { count: number; days: number; severity: WaitSeverity } | null;
  /** Admin feedback, Easy AI tips — anything the card should show inline. */
  notice?: ReactNode;
  /** One Button. It stretches to fill the row next to the menu. */
  primaryAction: ReactNode;
  /** The public listing, shown as a quiet link under the action when set. */
  publicHref?: string | null;
  menuItems: MenuItem[];
  /** "Updated Sep 30" */
  footnote?: string;
  loading?: boolean;
}) {
  const severity = waiting?.severity ?? "none";
  const badge = LIFECYCLE_BADGE[lifecycle];
  const filled = target > 0 && hired >= target;

  return (
    <article
      aria-label={title}
      className={cx(
        "relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-card border bg-eh-surface shadow-eh-sm transition-shadow duration-150 hover:shadow-eh-md",
        severity === "critical"
          ? "border-[color-mix(in_srgb,var(--eh-danger)_40%,var(--eh-line))]"
          : severity === "attention"
            ? "border-[color-mix(in_srgb,var(--eh-marigold)_55%,var(--eh-line))]"
            : "border-eh-line"
      )}
    >
      {/* A 3px top edge carries the state at a glance across the grid. */}
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
            {severity === "critical" ? (
              <StatusBadge tone="danger" dot>
                Overdue
              </StatusBadge>
            ) : severity === "attention" ? (
              <StatusBadge tone="warning" dot>
                Needs attention
              </StatusBadge>
            ) : (
              <StatusBadge tone={badge.tone} dot>
                {badge.label}
              </StatusBadge>
            )}
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

        {/* Numbers on a slightly recessed panel so they read as one block. */}
        <dl className="mt-5 grid grid-cols-3 divide-x divide-eh-line rounded-control border border-eh-line bg-eh-surface-2 px-3">
          <Metric label="Applicants" muted={applicants === 0}>
            {applicants}
          </Metric>
          <Metric label="Views">{views}</Metric>
          <Metric label="Hired">
            <span className={filled ? "text-eh-teal-ink" : undefined}>{hired}</span>
            <span className="text-body font-medium text-eh-muted">/{target}</span>
          </Metric>
        </dl>

        <div className="mt-5">
          <p className="mb-2 text-micro font-semibold uppercase tracking-[0.06em] text-eh-muted">Pipeline</p>
          {applicants > 0 ? (
            <PipelineMini
              showSummary
              className="[&>div:first-child]:h-2"
              stages={[
                { label: "Applied", value: pipeline.applied, tone: "muted" },
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

        {waiting && severity !== "none" && (
          <p
            className={cx(
              "num mt-4 flex items-center gap-2 rounded-control border px-3 py-2 text-small font-semibold",
              severity === "critical"
                ? "border-[color-mix(in_srgb,var(--eh-danger)_25%,transparent)] bg-eh-danger-tint text-eh-danger"
                : "border-[color-mix(in_srgb,var(--eh-marigold)_35%,transparent)] bg-eh-marigold-tint text-eh-marigold-ink"
            )}
          >
            {severity === "critical" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            {waiting.count === 1
              ? `1 applicant waiting ${plural(waiting.days, "day")}`
              : `${waiting.count} applicants waiting · oldest ${plural(waiting.days, "day")}`}
          </p>
        )}

        {notice && <div className="mt-4">{notice}</div>}

        <div className="mt-auto flex items-center gap-2 pt-5 [&>a:first-child]:flex-1 [&>button:first-child]:flex-1">
          {primaryAction}
          <DropdownMenu label={`More actions for ${title}`} items={menuItems} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-eh-line bg-eh-surface-2 px-5 py-2.5 text-small text-eh-muted">
        {publicHref ? (
          <Link
            href={publicHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-eh-ink-2 transition-colors duration-150 hover:text-eh-ink"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View listing
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
