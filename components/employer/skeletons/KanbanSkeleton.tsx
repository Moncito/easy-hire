import Bone from "@/components/employer/skeletons/Bone";

export default function KanbanSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 shrink-0 space-y-3">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-64" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-8 w-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="kanban-scroll flex min-h-0 flex-1 gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, col) => (
          <div
            key={col}
            className="flex h-full w-[min(100vw-3rem,20rem)] shrink-0 flex-col rounded-xl border border-ink/5 bg-white/60 p-2"
          >
            <Bone className="mb-3 h-5 w-24" />
            <Bone className="h-24 w-full rounded-xl bg-white/80" />
          </div>
        ))}
      </div>
    </div>
  );
}
