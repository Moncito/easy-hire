import { requireAdminPageContext } from "@/lib/auth/admin-session";
import { getAdminHomeDashboard } from "@/lib/admin/home-dashboard";
import MarketplacePulseBand from "@/components/admin/dashboard/MarketplacePulseBand";
import MoneyBandCard from "@/components/admin/dashboard/MoneyBandCard";
import WorkBand from "@/components/admin/dashboard/WorkBand";

/**
 * `/admin` Home — docs/ADMIN-CONSOLE-PLAN.md §4.1. Three bands, in the
 * plan's own priority order: "Liquidity first, money second, queues third —
 * because a queue you can clear tells you nothing about whether the
 * business works." Replaces the old 4-tile placeholder
 * (`getAdminDashboardMetrics`, lib/admin/dashboard.ts), which only ever
 * showed pending/live job counts — this reads the real aggregate,
 * `getAdminHomeDashboard`, straight from lib/admin/home-dashboard.ts (the
 * backend contract for this page; not modified here).
 *
 * Bare `requireAdminPageContext()`, not a specific `AdminPermission` — see
 * `getAdminHomeDashboard`'s own doc comment for why: every number in Bands 1
 * and 2 (plus Band 3's queue depths) is safe for any signed-in admin, and
 * the one genuinely sensitive slice (Band 3's per-admin decision/overturn
 * breakdown) is gated INSIDE the dashboard aggregate itself
 * (`PermissionGated<T>`), not by refusing the whole page.
 */
export default async function AdminDashboardPage() {
  const ctx = await requireAdminPageContext();
  const dashboard = await getAdminHomeDashboard(ctx.userId);

  const generatedAtLabel = dashboard.generatedAt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">
          Admin Console
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">Home</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">
          Signed in as {ctx.session.user.email} · Generated {generatedAtLabel}
        </p>
      </div>

      <MarketplacePulseBand pulse={dashboard.marketplacePulse} />
      <MoneyBandCard money={dashboard.money} />
      <WorkBand work={dashboard.work} />
    </div>
  );
}
