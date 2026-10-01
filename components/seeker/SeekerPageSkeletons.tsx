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

      {/* Stats strip — 3 cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-2xl bg-white px-5 py-4 ring-1 ring-ink/8">
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-2.5 w-24" />
            <Bone className="h-7 w-12" />
            <Bone className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Profile-strength banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-marigold/[0.07] px-5 py-4 ring-1 ring-marigold/20">
        <div className="space-y-1.5">
          <Bone className="h-4 w-52" />
          <Bone className="h-3 w-72" />
        </div>
        <Bone className="h-9 w-28 rounded-xl" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] xl:gap-8">
        <div className="min-w-0 space-y-8 xl:col-start-1 xl:row-start-1">
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

          {/* Interviews */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Bone className="h-4 w-4 rounded" />
              <Bone className="h-5 w-28" />
            </div>
            <div className="rounded-2xl bg-ink/[0.02] px-6 py-8 ring-1 ring-ink/6">
              <Bone className="mx-auto h-4 w-64" />
            </div>
          </div>

          {/* Recommended for you */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bone className="h-4 w-4 rounded" />
                <Bone className="h-5 w-36" />
              </div>
              <Bone className="h-3 w-20" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-ink/8">
                  <Bone className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Bone className="h-4 w-40" />
                    <Bone className="h-3 w-28" />
                  </div>
                  <Bone className="h-8 w-20 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Two-column: saved jobs + job alerts */}
          <div className="grid gap-8 sm:grid-cols-2">
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

        {/* Rail bones — hidden below xl, matching the real layout */}
        <div className="hidden space-y-4 xl:block xl:col-start-2 xl:row-start-1">
          <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/8">
            <Bone className="h-3 w-24" />
            <Bone className="h-9 w-9 rounded-xl" />
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-full" />
            <Bone className="h-9 w-full rounded-xl" />
          </div>
          <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/8">
            <Bone className="h-3 w-28" />
            <Bone className="h-14 w-14 rounded-full" />
            <Bone className="h-9 w-full rounded-xl" />
          </div>
          <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/8">
            <Bone className="h-3 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Bone key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
          <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/8">
            <Bone className="h-3 w-16" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Bone key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
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
  showSignalChips = false,
  showFolderBar = false,
  folderPillCount = 2,
  rowCount = 3,
  variant = "compact",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  showSearchBar?: boolean;
  /** Filter pills. Rendered beside the search bar when there is one, on their own row otherwise. */
  filterPillCount?: number;
  /** The labelled chip row on /seeker/recommended ("What shapes your matches"). */
  showSignalChips?: boolean;
  /** The "All saved" + per-folder pill row on /seeker/saved-jobs, above everything else including the search bar. */
  showFolderBar?: boolean;
  /** Number of folder pills to bone out, not counting the leading "All saved" pill or the trailing "New folder" pill. */
  folderPillCount?: number;
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

        {showFolderBar && (
          <div className="flex flex-wrap gap-1.5">
            <Bone className="h-7 w-20 rounded-full" />
            {Array.from({ length: folderPillCount }).map((_, i) => (
              <Bone key={i} className="h-7 w-24 rounded-full" />
            ))}
            <Bone className="h-7 w-28 rounded-full" />
          </div>
        )}

        {showSignalChips && (
          <div className="space-y-2">
            <Bone className="h-3 w-40" />
            <div className="flex flex-wrap gap-2">
              {["w-20", "w-24", "w-24", "w-32", "w-32"].map((w, i) => (
                <Bone key={i} className={`h-7 ${w} rounded-full`} />
              ))}
            </div>
          </div>
        )}

        {showSearchBar ? (
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
        ) : (
          filterPillCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: filterPillCount }).map((_, i) => (
                <Bone key={i} className="h-8 w-16 rounded-full" />
              ))}
            </div>
          )
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

function ProfileSidebarCardBones({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/8">
      <Bone className="h-3 w-24" />
      {Array.from({ length: rows }).map((_, i) => (
        <Bone key={i} className="h-9 w-full rounded-xl" />
      ))}
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

        {/* Hero row: hero card (80%) + live preview (20%), matching the real
            top-level grid — each column sized independently, no forced
            equal-height stretch. */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,320px)] xl:items-start xl:gap-6">
          <div className="min-w-0 space-y-5">
            {/* Hero card bone */}
            <div className="rounded-[28px] bg-ink/5 p-6 sm:p-8 lg:p-11">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
                  <Bone className="h-16 w-16 shrink-0 rounded-full sm:h-[72px] sm:w-[72px]" />
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <Bone className="h-6 w-44" />
                    <Bone className="h-4 w-56" />
                    <div className="flex gap-2 pt-1">
                      <Bone className="h-5 w-28 rounded-full" />
                      <Bone className="h-5 w-24 rounded-full" />
                    </div>
                    <Bone className="mt-3 h-9 w-40 rounded-xl" />
                  </div>
                </div>
                <div className="w-full shrink-0 space-y-3 rounded-2xl bg-ink/5 p-4 sm:p-5 lg:w-[280px]">
                  <Bone className="h-3 w-28" />
                  <Bone className="h-7 w-32" />
                  <Bone className="h-1.5 w-full rounded-full" />
                  <div className="space-y-2 pt-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Bone key={i} className="h-3 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Progress toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
              <Bone className="h-3 w-24" />
              <Bone className="h-10 w-32 rounded-xl" />
            </div>

            {/* Nav + form grid */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
              {/* Sidebar nav bones: icon-tile rows, two grouped sections */}
              <div className="hidden space-y-4 lg:block">
                <div className="space-y-1.5">
                  <Bone className="mb-2 h-3 w-16" />
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <Bone className="h-8 w-8 shrink-0 rounded-lg" />
                      <Bone className="h-3 w-24" />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Bone className="mb-2 h-3 w-20" />
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <Bone className="h-8 w-8 shrink-0 rounded-lg" />
                      <Bone className="h-3 w-28" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Form card bones */}
              <div className="rounded-2xl border border-ink/8 bg-white p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <Bone className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="space-y-1.5">
                    <Bone className="h-5 w-36" />
                    <Bone className="h-3 w-56" />
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Bone className="h-3 w-24" />
                    <Bone className="h-10 w-full rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Bone className="h-3 w-16" />
                    <Bone className="h-24 w-full rounded-lg" />
                  </div>
                  <Bone className="h-12 w-full rounded-xl" />
                </div>
                <div className="mt-6 flex justify-end border-t border-ink/8 pt-5">
                  <Bone className="h-9 w-36 rounded-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar bones: live preview, visibility, quick actions, stand out */}
          <div className="hidden space-y-4 xl:block">
            <div className="space-y-3 rounded-2xl bg-ink/5 p-6">
              <div className="flex items-center justify-between">
                <Bone className="h-3 w-20" />
                <Bone className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-3">
                <Bone className="h-14 w-14 shrink-0 rounded-2xl" />
                <div className="space-y-1.5">
                  <Bone className="h-4 w-24" />
                  <Bone className="h-3 w-20" />
                </div>
              </div>
              <Bone className="h-9 w-full rounded-2xl" />
            </div>
            <ProfileSidebarCardBones rows={1} />
            <ProfileSidebarCardBones rows={4} />
            <ProfileSidebarCardBones rows={1} />
          </div>
        </div>

        {/* Identity verification section bone */}
        <div className="rounded-[28px] bg-ink/5 p-6 lg:p-11">
          <div className="space-y-6">
            <div className="space-y-3">
              <Bone className="h-5 w-24 rounded-full" />
              <Bone className="h-6 w-48" />
              <Bone className="h-4 w-full max-w-md" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Bone className="h-6 w-6 shrink-0 rounded-full" />
                  <Bone className="h-3 w-20" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <Bone className="h-4 w-40" />
              <Bone className="mt-3 h-2 w-full rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-2xl bg-white p-4">
                  <div className="flex items-center gap-2.5">
                    <Bone className="h-8 w-8 shrink-0 rounded-lg" />
                    <Bone className="h-3 w-20" />
                  </div>
                  <Bone className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <Bone className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
