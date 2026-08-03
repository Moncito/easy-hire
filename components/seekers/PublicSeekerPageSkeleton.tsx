function Bone({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-ink/8 ${className ?? ""}`} aria-hidden="true" />;
}

export default function PublicSeekerPageSkeleton() {
  return (
    <div className="animate-fade-in pb-20">
      <div className="seekers-nav-band relative flex h-14 shrink-0 items-center justify-between px-6 sm:h-16 sm:px-8">
        <Bone className="h-6 w-36" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-ink/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Bone className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="space-y-2">
              <Bone className="h-4 w-24 rounded-full" />
              <Bone className="h-8 w-64" />
              <Bone className="h-4 w-40" />
            </div>
          </div>
          <Bone className="h-10 w-28 rounded-xl" />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 border-y border-ink/[0.06] py-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-3 w-16" />
              <Bone className="h-5 w-28" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-7 w-24 rounded-full" />
          ))}
        </div>

        <div className="mt-10 space-y-3">
          <Bone className="h-5 w-24" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
        </div>

        <div className="mt-10 divide-y divide-ink/[0.06] border-y border-ink/[0.06]">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2 py-5">
              <Bone className="h-5 w-48" />
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
