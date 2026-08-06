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
  status: string;
  title: string;
  emptyHint: string;
  applications: Application[];
  onCardClick: (application: Application) => void;
  hideHeader?: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  highlighted?: boolean;
  dotClass?: string;
  focusedApplicationId?: string | null;
};

export default function KanbanColumn({
  status,
  title,
  emptyHint,
  applications,
  onCardClick,
  hideHeader = false,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  highlighted = false,
  dotClass = "bg-ink/30",
  focusedApplicationId = null,
}: Props) {
  return (
    <div
      id={`kanban-col-${status}`}
      className={`flex h-full w-[min(100vw-3rem,20rem)] shrink-0 flex-col scroll-mt-28 transition ${
        highlighted ? "ring-2 ring-teal/20 ring-offset-2 ring-offset-[#F5F6F4] rounded-xl" : ""
      }`}
    >
      {!hideHeader && (
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/70">{title}</span>
          </div>
          <span className="font-data rounded-md bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-ink/50">
            {applications.length}
          </span>
        </div>
      )}

      <div className="kanban-column-body flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-ink/5 bg-white/60 p-2">
        {applications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-3 py-10 text-center">
            <Inbox className="mb-2 h-5 w-5 text-ink/15" aria-hidden="true" />
            <p className="text-xs font-medium text-ink/35">Empty</p>
            <p className="mt-1 max-w-[180px] text-[10px] leading-relaxed text-ink/30">{emptyHint}</p>
          </div>
        ) : (
          applications.map((app) => (
            <CandidateCard
              key={app.id}
              application={app}
              selectionMode={selectionMode}
              selected={selectedIds?.has(app.id)}
              focused={focusedApplicationId === app.id}
              dimmed={!!focusedApplicationId && focusedApplicationId !== app.id}
              onToggleSelect={onToggleSelect}
              onClick={() => onCardClick(app)}
            />
          ))
        )}
      </div>
    </div>
  );
}
