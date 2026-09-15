/**
 * Skeleton matching the final `/admin/system` layout (§5: "no spinners —
 * extend the app/admin/loading.tsx pattern"), same shape as
 * app/admin/system/team/loading.tsx: heading block, then one skeleton band
 * per section (cron cards, reachability tiles, row-count tiles, the
 * not-instrumented list).
 */
export default function SystemHealthLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-3 w-32 rounded bg-ink/10" />
        <div className="h-8 w-56 rounded-lg bg-ink/10" />
        <div className="h-4 w-96 max-w-full rounded bg-ink/5" />
      </div>

      <div className="space-y-8">
        <div>
          <div className="mb-3 h-5 w-32 rounded bg-ink/10" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-ink/5 bg-white p-4">
                <div className="h-3 w-20 rounded bg-ink/10" />
                <div className="mt-3 h-3 w-full rounded bg-ink/5" />
                <div className="mt-2 h-3 w-2/3 rounded bg-ink/5" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 h-5 w-48 rounded bg-ink/10" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl border border-ink/5 bg-white p-4">
                <div className="h-3 w-16 rounded bg-ink/10" />
                <div className="mt-3 h-4 w-24 rounded bg-ink/5" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 h-5 w-32 rounded bg-ink/10" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl border border-ink/5 bg-white p-4">
                <div className="h-3 w-14 rounded bg-ink/10" />
                <div className="mt-2 h-6 w-10 rounded bg-ink/5" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 h-5 w-40 rounded bg-ink/10" />
          <div className="overflow-hidden rounded-2xl border border-dashed border-ink/15 bg-mist/40">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex h-10 items-center gap-3 border-b border-ink/10 px-4 last:border-b-0">
                <div className="h-3 w-40 rounded bg-ink/10" />
                <div className="ml-auto h-3 w-24 rounded bg-ink/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
