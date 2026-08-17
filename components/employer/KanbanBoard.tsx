"use client";

import { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import KanbanBoardEmptyState from "./KanbanBoardEmptyState";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { PRO_STAGE_DOT } from "@/components/employer/pipeline-stage-styles";

type Application = {
  id: string;
  status: string;
  coverNote: string | null;
  appliedAt: string;
  seeker: {
    id: string;
    fullName: string;
    headline: string | null;
    skills: string[];
    resumeUrl: string | null;
  };
};

type JobContext = {
  id: string;
  status: string;
};

type Props = {
  applications: Application[];
  job: JobContext;
  companyVerified: boolean;
  onCardClick: (application: Application) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  activeStage?: string | null;
  focusedApplicationId?: string | null;
};

const primaryColumns = [
  {
    status: "APPLIED",
    title: "Applied",
    emptyHint: "New applications land here first.",
    dotClass: "bg-ink/30",
  },
  {
    status: "SHORTLISTED",
    title: "Shortlisted",
    emptyHint: "Promising candidates to review further.",
    dotClass: "bg-navy/60",
  },
  {
    status: "INTERVIEW",
    title: "Interview",
    emptyHint: "Candidates you're actively evaluating.",
    dotClass: "bg-teal/70",
  },
  {
    status: "HIRED",
    title: "Hired",
    emptyHint: "Successful hires for this role.",
    dotClass: "bg-teal",
  },
];

const rejectedColumn = {
  status: "REJECTED",
  title: "Rejected",
  emptyHint: "Candidates you passed on.",
  dotClass: "bg-ink/25",
};

export default function KanbanBoard({
  applications,
  job,
  companyVerified,
  onCardClick,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  activeStage,
  focusedApplicationId = null,
}: Props) {
  const { isPro } = useEmployerShell();
  const [showRejected, setShowRejected] = useState(false);
  const isEmpty = applications.length === 0;

  const rejectedApps = applications.filter((app) => app.status === rejectedColumn.status);
  const rejectedCount = rejectedApps.length;

  if (isEmpty) {
    return (
      <div className="h-full overflow-y-auto">
        <KanbanBoardEmptyState
          jobId={job.id}
          jobStatus={job.status}
          companyVerified={companyVerified}
        />
      </div>
    );
  }

  const showRejectedColumn = activeStage === "REJECTED" || showRejected || rejectedCount > 0;

  return (
    <div className="kanban-scroll h-full overflow-x-auto overflow-y-hidden pb-2">
      <div className="flex h-full min-w-max items-stretch gap-3 px-1">
        {primaryColumns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            emptyHint={col.emptyHint}
            dotClass={isPro ? (PRO_STAGE_DOT[col.status] ?? col.dotClass) : col.dotClass}
            highlighted={activeStage === col.status}
            applications={applications.filter((app) => app.status === col.status)}
            onCardClick={onCardClick}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
            focusedApplicationId={focusedApplicationId}
          />
        ))}

        <div className="flex h-full w-[min(100vw-3rem,20rem)] shrink-0 flex-col">
          <button
            type="button"
            onClick={() => setShowRejected((v) => !v)}
            className="mb-2.5 flex w-full items-center justify-between rounded-lg px-0.5 py-1.5 text-left transition-colors hover:bg-ink/[0.03]"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isPro ? (PRO_STAGE_DOT.REJECTED ?? rejectedColumn.dotClass) : rejectedColumn.dotClass
                }`}
                aria-hidden="true"
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">
                {rejectedColumn.title}
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <span className="font-data rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-ink/45">
                {rejectedCount}
              </span>
              {showRejected ? (
                <ChevronUp className="h-4 w-4 opacity-70" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 opacity-70" aria-hidden="true" />
              )}
            </span>
          </button>
          {showRejectedColumn && (
            <KanbanColumn
              status={rejectedColumn.status}
              title={rejectedColumn.title}
              emptyHint={rejectedColumn.emptyHint}
              dotClass={isPro ? (PRO_STAGE_DOT.REJECTED ?? rejectedColumn.dotClass) : rejectedColumn.dotClass}
              highlighted={activeStage === "REJECTED"}
              applications={rejectedApps}
              onCardClick={onCardClick}
              hideHeader
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              focusedApplicationId={focusedApplicationId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
