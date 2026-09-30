"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, Inbox, Paperclip } from "lucide-react";
import { Avatar, cx } from "@/components/employer/system";
import KanbanBoardEmptyState from "@/components/employer/KanbanBoardEmptyState";
import type { CandidateApplication } from "@/components/employer/candidate-detail/types";
import { PRO_REJECTED_STAGE, PRO_STAGES } from "@/components/employer/pro-applicants/stages";
import { waitSeverity } from "@/lib/employer/attention";
import { displaySkill } from "@/lib/seeker/profile-format";

const DAY_MS = 24 * 60 * 60 * 1000;

function appliedLabel(appliedAt: string, nowMs: number): string {
  const hours = Math.floor((nowMs - new Date(appliedAt).getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "Applied just now";
  if (hours < 24) return `Applied ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Applied ${days}d ago`;
  return `Applied ${new Date(appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/**
 * One candidate on the board: who, their headline, three skills, when they
 * applied, and whether a resume is attached. An unreviewed (Applied)
 * candidate who has waited 3+ days says so in marigold, past 14 in Ember —
 * the same rule as the job cards.
 */
function ProCandidateCard({
  application,
  nowMs,
  selectionMode,
  selected,
  focused,
  dimmed,
  onToggleSelect,
  onOpen,
}: {
  application: CandidateApplication;
  nowMs: number;
  selectionMode: boolean;
  selected: boolean;
  focused: boolean;
  dimmed: boolean;
  onToggleSelect?: (id: string) => void;
  onOpen: () => void;
}) {
  const { seeker } = application;
  const skills = seeker.skills ?? [];
  const waitingDays =
    application.status === "APPLIED" ? Math.floor((nowMs - new Date(application.appliedAt).getTime()) / DAY_MS) : null;
  const severity = waitSeverity(waitingDays);

  return (
    <div
      className={cx(
        "group relative rounded-control border bg-eh-surface shadow-eh-sm transition-[border-color,box-shadow,opacity] duration-150 focus-within:shadow-eh-md",
        selected || focused
          ? "border-eh-marigold shadow-eh-md ring-1 ring-eh-marigold"
          : "border-eh-line hover:border-[color-mix(in_srgb,var(--eh-ink)_20%,var(--eh-line))] hover:shadow-eh-md",
        dimmed && !selected && "opacity-60 hover:opacity-90"
      )}
    >
      <div className="flex items-start gap-2.5 p-3">
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(application.id)}
            className="mt-2.5 h-4 w-4 shrink-0 cursor-pointer rounded border-eh-line accent-[var(--eh-marigold)]"
            aria-label={`Select ${seeker.fullName}`}
          />
        )}
        <button
          type="button"
          onClick={selectionMode ? () => onToggleSelect?.(application.id) : onOpen}
          aria-pressed={selectionMode ? selected : undefined}
          className="min-w-0 flex-1 rounded-chip text-left"
        >
          <div className="flex items-start gap-2.5">
            <Avatar name={seeker.fullName} src={seeker.photoUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-ui font-semibold text-eh-ink">{seeker.fullName}</p>
              <p className="truncate text-small text-eh-muted">{seeker.headline || "Virtual Assistant"}</p>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="max-w-full truncate rounded-full border border-eh-line bg-eh-surface-2 px-2 py-0.5 text-[11px] text-eh-ink-2"
                >
                  {displaySkill(skill)}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="rounded-full px-1.5 py-0.5 text-[11px] text-eh-muted">+{skills.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-eh-line pt-2">
            {severity !== "none" ? (
              <span
                className={cx(
                  "num inline-flex items-center gap-1 text-[11px] font-semibold",
                  severity === "critical" ? "text-eh-danger" : "text-eh-marigold-ink"
                )}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                Waiting {waitingDays} {waitingDays === 1 ? "day" : "days"}
              </span>
            ) : (
              <span className="text-[11px] text-eh-muted">{appliedLabel(application.appliedAt, nowMs)}</span>
            )}
            {seeker.resumeUrl && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-eh-ink-2" title="Resume attached">
                <Paperclip className="h-3 w-3" aria-hidden="true" />
                Resume
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

function Column({
  status,
  label,
  dot,
  emptyHint,
  applications,
  highlighted,
  hideHeader = false,
  cardProps,
}: {
  status: string;
  label: string;
  dot: string;
  emptyHint: string;
  applications: CandidateApplication[];
  highlighted: boolean;
  hideHeader?: boolean;
  cardProps: (app: CandidateApplication) => Omit<Parameters<typeof ProCandidateCard>[0], "application">;
}) {
  return (
    <section
      id={`kanban-col-${status}`}
      aria-label={`${label}, ${applications.length} ${applications.length === 1 ? "candidate" : "candidates"}`}
      className="flex h-full w-[min(100vw-3rem,18.5rem)] shrink-0 scroll-mt-28 flex-col"
    >
      {!hideHeader && (
        <header className="mb-2 flex items-center justify-between px-1">
          <span className="flex items-center gap-2">
            <span className={cx("h-2 w-2 rounded-full", dot)} aria-hidden="true" />
            <span className="text-ui font-semibold text-eh-ink">{label}</span>
          </span>
          <span className="num rounded-full border border-eh-line bg-eh-surface px-2 py-px text-xs font-medium text-eh-ink-2">
            {applications.length}
          </span>
        </header>
      )}
      <div
        className={cx(
          "kanban-column-body flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-card border bg-eh-surface-2 p-2 transition-shadow duration-150",
          highlighted
            ? "border-[color-mix(in_srgb,var(--eh-ink)_30%,var(--eh-line))] shadow-[inset_0_0_0_1px_var(--eh-ink-2)]"
            : "border-eh-line"
        )}
      >
        {applications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-3 py-10 text-center">
            <Inbox className="h-5 w-5 text-eh-muted" aria-hidden="true" />
            <p className="text-small font-medium text-eh-ink-2">No one here yet</p>
            <p className="max-w-[190px] text-micro text-eh-muted">{emptyHint}</p>
          </div>
        ) : (
          applications.map((app) => <ProCandidateCard key={app.id} application={app} {...cardProps(app)} />)
        )}
      </div>
    </section>
  );
}

/**
 * Pro pipeline board: four stage columns plus a collapsible Rejected
 * column. Same props and behaviour as the shared KanbanBoard (click to
 * open, selection mode, stage highlight); only the presentation differs.
 */
export default function ProKanbanBoard({
  applications,
  job,
  companyVerified,
  nowMs,
  onCardClick,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  activeStage,
  focusedApplicationId = null,
}: {
  applications: CandidateApplication[];
  job: { id: string; status: string };
  companyVerified: boolean;
  nowMs: number;
  onCardClick: (application: CandidateApplication) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  activeStage?: string | null;
  focusedApplicationId?: string | null;
}) {
  const [showRejected, setShowRejected] = useState(false);

  if (applications.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <KanbanBoardEmptyState jobId={job.id} jobStatus={job.status} companyVerified={companyVerified} />
      </div>
    );
  }

  const cardProps = (app: CandidateApplication) => ({
    nowMs,
    selectionMode,
    selected: selectedIds?.has(app.id) ?? false,
    focused: focusedApplicationId === app.id,
    dimmed: !!focusedApplicationId && focusedApplicationId !== app.id,
    onToggleSelect,
    onOpen: () => onCardClick(app),
  });

  const rejected = applications.filter((a) => a.status === PRO_REJECTED_STAGE.status);
  const rejectedOpen = activeStage === "REJECTED" || showRejected;

  return (
    <div className="kanban-scroll h-full overflow-x-auto overflow-y-hidden pb-2">
      <div className="flex h-full min-w-max items-stretch gap-3 px-0.5">
        {PRO_STAGES.map((stage) => (
          <Column
            key={stage.status}
            status={stage.status}
            label={stage.label}
            dot={stage.dot}
            emptyHint={stage.emptyHint}
            applications={applications.filter((a) => a.status === stage.status)}
            highlighted={activeStage === stage.status}
            cardProps={cardProps}
          />
        ))}

        <div className="flex h-full w-[min(100vw-3rem,18.5rem)] shrink-0 flex-col">
          <button
            type="button"
            onClick={() => setShowRejected((v) => !v)}
            aria-expanded={rejectedOpen}
            className="mb-2 flex w-full items-center justify-between rounded-chip px-1 py-0.5 text-left transition-colors duration-150 hover:bg-eh-surface-2"
          >
            <span className="flex items-center gap-2">
              <span className={cx("h-2 w-2 rounded-full", PRO_REJECTED_STAGE.dot)} aria-hidden="true" />
              <span className="text-ui font-semibold text-eh-ink-2">{PRO_REJECTED_STAGE.label}</span>
            </span>
            <span className="flex items-center gap-1.5 text-eh-muted">
              <span className="num rounded-full border border-eh-line bg-eh-surface px-2 py-px text-xs font-medium text-eh-ink-2">
                {rejected.length}
              </span>
              {rejectedOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            </span>
          </button>
          {rejectedOpen ? (
            <Column
              status={PRO_REJECTED_STAGE.status}
              label={PRO_REJECTED_STAGE.label}
              dot={PRO_REJECTED_STAGE.dot}
              emptyHint={PRO_REJECTED_STAGE.emptyHint}
              applications={rejected}
              highlighted={activeStage === "REJECTED"}
              hideHeader
              cardProps={cardProps}
            />
          ) : (
            <p className="rounded-card border border-dashed border-eh-line px-3 py-4 text-center text-small text-eh-muted">
              {rejected.length === 0 ? "No one rejected" : "Hidden — open to review"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
