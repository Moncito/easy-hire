/**
 * Skeleton matching the final `/admin/users/[id]` layout: identity card,
 * trust panel, role-detail panel, activity list, actions row.
 */
export default function AdminUserRecordLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-5">
      <div className="h-3 w-28 rounded bg-ink/10" />

      <div className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="h-7 w-64 rounded-lg bg-ink/10" />
        <div className="mt-3 h-3 w-80 max-w-full rounded bg-ink/5" />
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5">
          <div className="h-5 w-32 rounded bg-ink/10" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-14 rounded-xl bg-ink/5" />
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="h-5 w-24 rounded bg-ink/10" />
        <div className="mt-3 flex gap-2">
          <div className="h-9 w-40 rounded-xl bg-ink/5" />
          <div className="h-9 w-40 rounded-xl bg-ink/5" />
        </div>
      </div>
    </div>
  );
}
