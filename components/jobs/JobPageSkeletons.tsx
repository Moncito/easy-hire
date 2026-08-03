function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ink/8 ${className ?? ""}`} aria-hidden="true" />;
}

export function JobListRowSkeleton() {
  return (
    <div className="mx-1 mb-1.5 rounded-xl border border-transparent px-3 py-3">
      <div className="flex items-start gap-3">
        <Bone className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-4 w-[85%]" />
          <Bone className="h-3 w-1/2" />
          <div className="flex gap-1.5">
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-14 rounded-full" />
          </div>
          <Bone className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function JobDetailPanelSkeleton() {
  return (
    <div className="px-6 py-5 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <Bone className="h-4 w-24" />
        <Bone className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex items-start gap-4">
        <Bone className="h-14 w-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex gap-2">
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-20 rounded-full" />
          </div>
          <Bone className="h-7 w-full max-w-md" />
          <Bone className="h-4 w-40" />
          <Bone className="h-4 w-56" />
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-ink/5 bg-marigold/5 p-5">
        <Bone className="h-4 w-32" />
        <Bone className="mt-2 h-3 w-full max-w-sm" />
        <Bone className="mt-4 h-10 w-full rounded-xl" />
      </div>
      <div className="mt-6 space-y-3">
        <Bone className="h-5 w-28" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-[80%]" />
      </div>
    </div>
  );
}

export function JobSearchSplitSkeleton({ columnWidth = 320 }: { columnWidth?: number }) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div
        className="jobs-workspace-scroll shrink-0 space-y-3 overflow-y-auto border-r border-ink/[0.06] p-5"
        style={{ width: columnWidth }}
      >
        <Bone className="h-8 w-32" />
        <Bone className="h-10 w-full rounded-xl" />
        <Bone className="h-24 w-full rounded-xl" />
      </div>
      <div
        className="flex shrink-0 flex-col border-r border-ink/[0.06]"
        style={{ width: columnWidth }}
      >
        <div className="space-y-3 border-b border-ink/[0.06] bg-mist/55 p-3">
          <Bone className="h-10 w-full rounded-xl" />
          <Bone className="h-5 w-48" />
        </div>
        <div className="jobs-workspace-scroll flex-1 overflow-y-auto p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <JobListRowSkeleton key={i} />
          ))}
        </div>
      </div>
      <div className="jobs-workspace-scroll min-w-0 flex-1 overflow-y-auto">
        <JobDetailPanelSkeleton />
      </div>
    </div>
  );
}
