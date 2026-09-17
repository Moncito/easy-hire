import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { listAuditLogForAdmin, getAuditLogStats, encodeAuditCursor, ADMIN_AUDIT_ACTIONS } from "@/lib/admin/audit";
import AuditLogDirectory from "@/components/admin/audit/AuditLogDirectory";

/**
 * `/admin/audit` — every admin action, filterable (docs/ADMIN-CONSOLE-PLAN.md
 * §4.9). Server component renders the first (unfiltered) page by calling
 * `listAuditLogForAdmin` directly (§5: "Server components for reads"), gated
 * on `audit.read` — matches `GET /api/admin/audit`.
 *
 * `ADMIN_AUDIT_ACTIONS` is a runtime array from lib/admin/audit.ts, which
 * also imports `prisma` — safe to import here (server-only) and pass down as
 * a plain string array prop, never imported directly by the client shell
 * (see components/admin/audit/types.ts's header comment for why).
 */
export default async function AdminAuditPage() {
  const ctx = await requireAdminPagePermission("audit.read");

  // `getAuditLogStats` is an unfiltered whole-platform snapshot (see its own
  // doc comment in lib/admin/audit.ts) — independent of the table's first
  // page, so it's fetched in parallel rather than after.
  const [{ logs, nextCursor }, stats] = await Promise.all([
    listAuditLogForAdmin(ctx.userId, { limit: 50 }),
    getAuditLogStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Trust / Audit</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">Audit log</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">
          Every admin decision, append-only and never edited — who, what, when, target, and the before/after state
          where one was recorded. Rows taken during an active impersonation session are flagged.
        </p>
      </div>

      <AuditLogDirectory
        actions={[...ADMIN_AUDIT_ACTIONS]}
        initialLogs={JSON.parse(JSON.stringify(logs))}
        initialNextCursor={nextCursor ? encodeAuditCursor(nextCursor) : null}
        stats={JSON.parse(JSON.stringify(stats))}
      />
    </div>
  );
}
