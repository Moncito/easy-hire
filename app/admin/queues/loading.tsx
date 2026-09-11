/**
 * Skeleton for /admin/queues and /admin/queues/[kind] — matches the final
 * layout (status tabs + search, dense 32px table rows, review pane) per
 * docs/ADMIN-CONSOLE-PLAN.md §5: "a skeleton matching the final layout
 * (no spinners)". Extends the existing app/admin/loading.tsx pattern.
 */
export default function AdminQueuesLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-40 rounded bg-ink/10" />
        <div className="mt-2 h-8 w-64 rounded-lg bg-ink/10" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-ink/5" />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="h-10 w-64 rounded-xl bg-ink/5" />
        <div className="h-10 w-64 rounded-xl bg-ink/5" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
        <div className="h-8 border-b border-ink/10 bg-mist/70" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex h-8 items-center gap-3 border-b border-ink/5 px-3">
            <div className="h-3.5 w-3.5 rounded bg-ink/10" />
            <div className="h-3 w-20 rounded bg-ink/10" />
            <div className="h-3 flex-1 max-w-xs rounded bg-ink/5" />
            <div className="h-3 w-24 rounded bg-ink/5" />
            <div className="ml-auto h-3 w-10 rounded bg-ink/10" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="h-72 rounded-2xl border border-ink/5 bg-white" />
        <div className="h-72 rounded-2xl border border-ink/5 bg-white" />
      </div>
    </div>
  );
}
