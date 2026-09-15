import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { getSystemHealth } from "@/lib/admin/system-health";
import SystemHealthDashboard from "@/components/admin/system/SystemHealthDashboard";
import type { SerializedSystemHealthReport } from "@/components/admin/system/types";

/**
 * `/admin/system` — the system health screen (docs/ADMIN-CONSOLE-PLAN.md
 * §4.10, scope approved in docs/build-plan.md's Sprint 11 entry). Server
 * component renders the first (and only — this screen has no client
 * mutations) paint by calling `getSystemHealth` directly, gated on
 * `system.read`, exactly the pattern `app/admin/system/team/page.tsx` uses.
 *
 * `JSON.parse(JSON.stringify(...))` converts every `Date` to an ISO string
 * for the client-safe wire shape in `components/admin/system/types.ts` — same
 * convention as the team page's own serialization step.
 */
export default async function SystemHealthPage() {
  const ctx = await requireAdminPagePermission("system.read");

  const health = await getSystemHealth(ctx.userId);
  const report = JSON.parse(JSON.stringify(health)) as SerializedSystemHealthReport;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">System / Health</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">System health</h1>
        <p className="mt-2 text-sm text-ink/55">
          Cron run history, database reachability, and configuration — plus an honest accounting of what this app
          does not measure yet.
        </p>
      </div>

      <SystemHealthDashboard report={report} />
    </div>
  );
}
