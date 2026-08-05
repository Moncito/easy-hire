"use client";

import { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import KanbanBoardEmptyState from "./KanbanBoardEmptyState";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  onCardClick: (application: Application) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
};

const primaryColumns = [
  { status: "APPLIED", title: "Applied", emptyHint: "New applications land here first." },
  { status: "SHORTLISTED", title: "Shortlisted", emptyHint: "Promising candidates you want to review further." },
  { status: "INTERVIEW", title: "Interview", emptyHint: "Candidates you're actively evaluating." },
  { status: "HIRED", title: "Hired", emptyHint: "Successful hires for this role." },
];

const rejectedColumn = {
  status: "REJECTED",
  title: "Rejected",
  emptyHint: "Candidates you passed on.",
};

export default function KanbanBoard({
  applications,
  job,
  onCardClick,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  const [showRejected, setShowRejected] = useState(false);
  const isEmpty = applications.length === 0;

  const rejectedApps = applications.filter((app) => app.status === rejectedColumn.status);
  const rejectedCount = rejectedApps.length;

  return (
    <div>
      {isEmpty && <KanbanBoardEmptyState jobId={job.id} jobStatus={job.status} />}

      <div className="kanban-scroll -mx-2 overflow-x-auto pb-3">
        <div className="flex min-w-max items-stretch gap-4 px-2">
          {primaryColumns.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              emptyHint={col.emptyHint}
              applications={applications.filter((app) => app.status === col.status)}
              onCardClick={onCardClick}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
            />
          ))}

          <div className="flex w-80 shrink-0 flex-col">
            <button
              type="button"
              onClick={() => setShowRejected((v) => !v)}
              className="mb-3 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-ink/[0.03]"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">
                {rejectedColumn.title}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-data text-xs font-bold text-ink/45">{rejectedCount}</span>
                {showRejected ? (
                  <ChevronUp className="h-4 w-4 opacity-70" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 opacity-70" aria-hidden="true" />
                )}
              </span>
            </button>
            {showRejected && (
              <KanbanColumn
                title={rejectedColumn.title}
                emptyHint={rejectedColumn.emptyHint}
                applications={rejectedApps}
                onCardClick={onCardClick}
                hideHeader
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={onToggleSelect}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
