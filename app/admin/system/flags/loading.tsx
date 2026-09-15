/**
 * Skeleton matching the final `/admin/system/flags` layout (§5: "no
 * spinners"), same shape as `app/admin/system/team/loading.tsx`.
 */
export default function FeatureFlagsLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-3 w-40 rounded bg-ink/10" />
        <div className="h-8 w-56 rounded-lg bg-ink/10" />
        <div className="h-4 w-full max-w-xl rounded bg-ink/5" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-4 w-24 rounded bg-ink/10" />
        <div className="h-9 w-32 rounded-xl bg-ink/10" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
        <div className="h-8 border-b border-ink/10 bg-mist/70" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex h-8 items-center gap-3 border-b border-ink/5 px-3">
            <div className="h-3 w-28 rounded bg-ink/10" />
            <div className="h-3 w-40 rounded bg-ink/5" />
            <div className="h-3 w-10 rounded bg-ink/5" />
            <div className="h-3 w-14 rounded bg-ink/5" />
            <div className="ml-auto h-3 w-16 rounded bg-ink/10" />
            <div className="h-3 w-12 rounded bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
