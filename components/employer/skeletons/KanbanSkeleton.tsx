import Bone from "@/components/employer/skeletons/Bone";

export default function KanbanSkeleton() {
  return (
    <div className="flex h-full min-h-[480px] flex-col">
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="space-y-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-64" />
        </div>
        <Bone className="h-9 w-28 rounded-lg" />
      </div>
      <div className="kanban-scroll flex flex-1 gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, col) => (
          <div
            key={col}
            className="flex w-[320px] shrink-0 flex-col rounded-2xl bg-ink/[0.02] p-3"
          >
            <Bone className="mb-3 h-5 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, row) => (
                <Bone key={row} className="h-24 w-full rounded-xl bg-white/80" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
