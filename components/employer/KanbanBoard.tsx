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
  onStatusChange: (id: string, newStatus: string) => void;
  onCardClick: (application: Application) => void;
};

const primaryColumns = [
  {
    status: "APPLIED",
    title: "Applied",
    headerClass: "bg-marigold/10 border-marigold/20 text-[#8a5a10]",
    emptyHint: "New applications land here first.",
  },
  {
    status: "SHORTLISTED",
    title: "Shortlisted",
    headerClass: "bg-navy/8 border-navy/15 text-navy",
    emptyHint: "Promising candidates you want to review further.",
  },
  {
    status: "INTERVIEW",
    title: "Interview",
    headerClass: "bg-teal/10 border-teal/20 text-teal",
    emptyHint: "Candidates you're actively evaluating.",
  },
  {
    status: "HIRED",
    title: "Hired",
    headerClass: "bg-teal/15 border-teal/25 text-teal",
    emptyHint: "Successful hires for this role.",
  },
];

const rejectedColumn = {
  status: "REJECTED",
  title: "Rejected",
  headerClass: "bg-ember/8 border-ember/15 text-ember",
  emptyHint: "Candidates you passed on.",
};

export default function KanbanBoard({ applications, job, onStatusChange, onCardClick }: Props) {
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
              headerClass={col.headerClass}
              emptyHint={col.emptyHint}
              applications={applications.filter((app) => app.status === col.status)}
              onCardClick={onCardClick}
            />
          ))}

          <div className="flex w-80 shrink-0 flex-col">
            <button
              type="button"
              onClick={() => setShowRejected((v) => !v)}
              className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${rejectedColumn.headerClass} hover:opacity-90`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                {rejectedColumn.title}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-white/60 px-2 py-0.5 font-data text-xs font-bold">
                  {rejectedCount}
                </span>
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
                headerClass={rejectedColumn.headerClass}
                emptyHint={rejectedColumn.emptyHint}
                applications={rejectedApps}
                onCardClick={onCardClick}
                hideHeader
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
