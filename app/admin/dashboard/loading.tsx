/**
 * Skeleton matching `/admin/dashboard`'s actual three-band shape
 * (docs/ADMIN-UI-UPGRADE.md §5.1 flagged this route as missing a
 * route-matched skeleton — it was falling back to the generic
 * `app/admin/loading.tsx`, which doesn't resemble this page at all). Same
 * convention as `app/admin/system/team/loading.tsx`: heading block, then one
 * skeleton shape per real section below it, `animate-pulse`, no spinner.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-10">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-ink/10 admin-dark:bg-white/10" />
        <div className="h-8 w-40 rounded-lg bg-ink/10 admin-dark:bg-white/10" />
        <div className="h-4 w-72 max-w-full rounded bg-ink/5 admin-dark:bg-white/5" />
      </div>

      {/* Band 1 — marketplace pulse: 3 metric tiles + supply/demand tiles */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded-lg bg-ink/10 admin-dark:bg-white/10" />
          <div className="h-4 w-96 max-w-full rounded bg-ink/5 admin-dark:bg-white/5" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-ink/5 bg-white p-4 admin-dark:border-white/10 admin-dark:bg-white/5">
              <div className="h-3 w-24 rounded bg-ink/10 admin-dark:bg-white/10" />
              <div className="mt-2 h-7 w-16 rounded bg-ink/10 admin-dark:bg-white/10" />
              <div className="mt-2 h-3 w-32 rounded bg-ink/5 admin-dark:bg-white/5" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-mist/60 admin-dark:bg-white/5" />
          ))}
        </div>
      </div>

      {/* Band 2 — money: one dashed "not available" card */}
      <div className="h-28 rounded-2xl border border-dashed border-ink/15 bg-mist/40 admin-dark:border-white/15 admin-dark:bg-white/5" />

      {/* Band 3 — work: 5 queue tiles + two panels */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-24 rounded-lg bg-ink/10 admin-dark:bg-white/10" />
          <div className="h-4 w-80 max-w-full rounded bg-ink/5 admin-dark:bg-white/5" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border border-ink/5 bg-white p-4 admin-dark:border-white/10 admin-dark:bg-white/5" />
          ))}
        </div>
        <div className="h-40 rounded-2xl border border-ink/5 bg-white admin-dark:border-white/10 admin-dark:bg-white/5" />
        <div className="h-24 rounded-2xl border border-ink/5 bg-white admin-dark:border-white/10 admin-dark:bg-white/5" />
      </div>
    </div>
  );
}
