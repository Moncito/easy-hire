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
  headerClass: string;
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
  headerClass,
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
        <div
          className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2.5 ${headerClass}`}
        >
          <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
          <span className="rounded-full bg-white/70 px-2 py-0.5 font-data text-xs font-bold">
            {applications.length}
          </span>
        </div>
      )}

      <div className="kanban-column-body flex min-h-[min(520px,calc(100vh-18rem))] flex-1 flex-col gap-3 rounded-2xl border border-ink/5 bg-mist/80 p-3">
        {applications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-ink/10 bg-white/50 px-4 py-8 text-center">
            <Inbox className="mb-2 h-5 w-5 text-ink/25" aria-hidden="true" />
            <p className="text-xs font-medium text-ink/45">No candidates</p>
            <p className="mt-1 max-w-[200px] text-[10px] leading-relaxed text-ink/35">{emptyHint}</p>
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
