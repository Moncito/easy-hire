import CandidateCard from "./CandidateCard";
import { Inbox } from "lucide-react";

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

type Props = {
  title: string;
  emptyHint: string;
  applications: Application[];
  onCardClick: (application: Application) => void;
  hideHeader?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
};

export default function KanbanColumn({
  title,
  emptyHint,
  applications,
  onCardClick,
  hideHeader = false,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  return (
    <div className="flex w-80 shrink-0 flex-col">
      {!hideHeader && (
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/70">{title}</span>
          <span className="font-data text-xs font-bold text-ink/50">{applications.length}</span>
        </div>
      )}

      <div className="kanban-column-body flex min-h-[min(520px,calc(100vh-18rem))] flex-1 flex-col gap-2.5 rounded-xl bg-ink/[0.02] p-2.5">
        {applications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
            <Inbox className="mb-2 h-5 w-5 text-ink/20" aria-hidden="true" />
            <p className="text-xs font-medium text-ink/40">No candidates</p>
            <p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-ink/30">{emptyHint}</p>
          </div>
        ) : (
          applications.map((app) => (
            <CandidateCard
              key={app.id}
              application={app}
              selectionMode={selectionMode}
              selected={selectedIds?.has(app.id)}
              onToggleSelect={onToggleSelect}
              onClick={() => onCardClick(app)}
            />
          ))
        )}
      </div>
    </div>
  );
}
