function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ink/8 ${className ?? ""}`} aria-hidden="true" />;
}

export default function CompanyPageSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      <div className="companies-nav-band relative flex h-14 shrink-0 items-center justify-between px-6 sm:h-16 sm:px-8">
        <Bone className="h-6 w-40" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        <Bone className="mb-8 h-4 w-28" />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Bone className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Bone className="h-8 w-56 sm:w-72" />
              <Bone className="h-4 w-32" />
            </div>
          </div>
          <Bone className="h-4 w-24" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 border-y border-ink/[0.06] py-6 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-3 w-16" />
              <Bone className="h-5 w-24" />
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <Bone className="h-5 w-36" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>

        <div className="mt-12">
          <Bone className="mb-6 h-6 w-40" />
          <div className="divide-y divide-ink/[0.06]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4 py-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <Bone className="h-5 w-3/4 max-w-sm" />
                  <Bone className="h-3 w-48" />
                  <Bone className="h-3 w-32" />
                </div>
                <Bone className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
