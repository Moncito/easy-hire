/**
 * Skeleton matching the final `/admin/companies/[id]` layout: identity card,
 * trust panel, jobs stat row, performance stat row, members table.
 */
export default function AdminCompanyDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse space-y-5">
      <div className="h-3 w-32 rounded bg-ink/10" />

      <div className="rounded-2xl border border-ink/5 bg-white p-5">
        <div className="h-7 w-72 rounded-lg bg-ink/10" />
        <div className="mt-3 h-3 w-96 max-w-full rounded bg-ink/5" />
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-ink/5 bg-white p-5">
          <div className="h-5 w-28 rounded bg-ink/10" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-14 rounded-xl bg-ink/5" />
            ))}
          </div>
        </div>
      ))}

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
        <div className="h-8 border-b border-ink/10 bg-mist/70" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex h-8 items-center gap-3 border-b border-ink/5 px-3">
            <div className="h-3 w-40 rounded bg-ink/10" />
            <div className="ml-auto h-3 w-16 rounded bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
