function Bone({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-ink/8 ${className ?? ""}`} aria-hidden="true" />
  );
}

export function SeekerNavBandSkeleton() {
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      <div className="seeker-nav-band relative flex h-12 shrink-0 items-center justify-between px-4 sm:h-14 sm:px-6 lg:h-16 lg:px-8">
        <Bone className="h-6 w-32" />
        <Bone className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function SeekerDashboardSkeleton() {
  return (
    <div className="pb-16 pt-6 sm:pt-8">
      <SeekerNavBandSkeleton />
      <div className="mt-6 space-y-8 sm:mt-8">
      {/* Header */}
      <div className="space-y-2">
        <Bone className="h-9 w-56 sm:w-72" />
        <Bone className="h-4 w-44" />
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap divide-y divide-ink/8 overflow-hidden rounded-2xl bg-ink/[0.03] ring-1 ring-ink/8 sm:divide-x sm:divide-y-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex min-w-[120px] flex-1 flex-col gap-2 px-5 py-4">
            <Bone className="h-2.5 w-20" />
            <Bone className="h-7 w-12" />
            {i === 0 && <Bone className="h-1 w-full rounded-full" />}
          </div>
        ))}
      </div>

      {/* Application tracking */}
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Bone className="h-6 w-48" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-6 w-14 rounded-full" />
            ))}
          </div>
        </div>

        {/* Featured timeline card */}
        <div className="rounded-2xl bg-white px-6 py-5 ring-1 ring-ink/8 shadow-[0_2px_12px_rgba(32,36,43,0.05)]">
          <Bone className="mb-4 h-4 w-52" />
          <Bone className="mb-5 h-3 w-36" />
          <div className="flex items-center justify-between gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <Bone className="h-8 w-8 rounded-full" />
                <Bone className="h-2.5 w-full max-w-[56px] rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline list */}
        <div className="mt-3 divide-y divide-ink/5 rounded-2xl bg-white px-5 ring-1 ring-ink/8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3.5">
              <div className="space-y-1.5">
                <Bone className="h-4 w-40" />
                <Bone className="h-3 w-28" />
              </div>
              <Bone className="h-7 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: saved jobs + job alerts */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Saved jobs */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Bone className="h-4 w-4 rounded" />
            <Bone className="h-5 w-24" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5 py-1">
                <Bone className="h-4 w-48" />
                <Bone className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Job alerts */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Bone className="h-4 w-4 rounded" />
            <Bone className="h-5 w-24" />
          </div>
          <div className="rounded-xl bg-ink/[0.03] px-4 py-3 ring-1 ring-ink/8">
            <Bone className="mb-2 h-4 w-40" />
            <Bone className="h-3 w-28" />
          </div>
          <Bone className="mt-3 h-9 w-36 rounded-xl" />
        </div>
      </div>
      </div>
    </div>
  );
}

/**
 * Shared list-page skeleton for thin seeker list routes (job alerts, saved
 * jobs, and similar). Parameterized so callers can opt into a search/filter
 * bar and a denser "detailed" row (larger avatar + extra description line)
 * without duplicating the nav band + Bone markup per route.
 */
export function SeekerListPageSkeleton({
  titleWidth = "w-40",
  subtitleWidth = "w-64",
  showSearchBar = false,
  filterPillCount = 0,
  rowCount = 3,
  variant = "compact",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  showSearchBar?: boolean;
  filterPillCount?: number;
  rowCount?: number;
  variant?: "compact" | "detailed";
}) {
  const detailed = variant === "detailed";
  return (
    <div className="pb-16">
      <SeekerNavBandSkeleton />
      <div className="space-y-6 pt-6 sm:pt-8">
        <div className="space-y-2">
          <Bone className={`h-9 ${titleWidth}`} />
          <Bone className={`h-4 ${subtitleWidth}`} />
        </div>

        {showSearchBar && (
          <div className="flex flex-col gap-3 lg:flex-row">
            <Bone className="h-10 flex-1 rounded-full" />
            {filterPillCount > 0 && (
              <div className="flex gap-2">
                {Array.from({ length: filterPillCount }).map((_, i) => (
                  <Bone key={i} className="h-8 w-16 rounded-full" />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="divide-y divide-ink/8">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Bone
                className={
                  detailed
                    ? "h-12 w-12 shrink-0 rounded-xl"
                    : "h-11 w-11 shrink-0 rounded-full"
                }
              />
              <div className="flex-1 space-y-2">
                <Bone className="h-5 w-48" />
                <Bone className="h-3 w-32" />
                {detailed && <Bone className="h-4 w-full max-w-sm" />}
              </div>
              <Bone className={detailed ? "h-9 w-24 rounded-full" : "h-8 w-20 rounded-full"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SeekerProfileSkeleton() {
  return (
    <div className="pb-16 pt-6 sm:pt-8">
      <SeekerNavBandSkeleton />
      <div className="mt-6 space-y-6 sm:mt-8">
      {/* Header */}
      <div className="space-y-1.5">
        <Bone className="h-9 w-36 sm:w-48" />
        <Bone className="h-4 w-56" />
      </div>

      {/* Progress toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Bone className="h-3 w-44" />
          <Bone className="h-[2px] w-48 rounded-none sm:w-64" />
        </div>
        <Bone className="h-10 w-32 rounded-xl" />
      </div>

      {/* 3-column grid */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(280px,340px)]">
        {/* Sidebar nav bones */}
        <div className="hidden space-y-1.5 lg:block">
          <Bone className="mb-3 h-3 w-28" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Bone key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>

        {/* Form panel bones */}
        <div className="space-y-6">
          <Bone className="h-0.5 w-10 rounded-none" />
          <div className="space-y-1.5">
            <Bone className="h-7 w-44" />
            <Bone className="h-4 w-64" />
          </div>
          <div className="space-y-2.5">
            <Bone className="h-3 w-20" />
            <Bone className="h-[2px] w-full rounded-none" />
          </div>
          <div className="space-y-2.5">
            <Bone className="h-3 w-16" />
            <Bone className="h-[2px] w-full rounded-none" />
            <Bone className="h-[2px] w-4/5 rounded-none" />
            <Bone className="h-[2px] w-3/4 rounded-none" />
            <Bone className="h-[2px] w-full rounded-none" />
            <Bone className="h-[2px] w-2/3 rounded-none" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-9 w-32 rounded-xl" />
            <Bone className="h-9 w-36 rounded-xl" />
          </div>
        </div>

        {/* Preview card bones */}
        <div className="hidden xl:block">
          <div className="rounded-2xl border border-navy/8 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <Bone className="h-6 w-24 rounded-full" />
              <Bone className="h-7 w-28 rounded-lg" />
            </div>
            <div className="mb-4 flex items-center gap-3">
              <Bone className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="space-y-1.5">
                <Bone className="h-4 w-28" />
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-16" />
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Bone key={i} className="h-5 w-14 rounded-md" />
              ))}
            </div>
            <div className="space-y-1.5">
              <Bone className="h-3 w-28" />
              <Bone className="h-3 w-20" />
            </div>
            <Bone className="mt-4 h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
