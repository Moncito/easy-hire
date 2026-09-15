/**
 * Client-side (serialized) mirror of lib/admin/audit.ts's `listAuditLog` /
 * `listAuditLogForAdmin` read shape (Prisma's raw `AdminAuditLog` row) —
 * docs/ADMIN-CONSOLE-PLAN.md §4.9. Same "Date -> ISO string" wire convention
 * as every other admin screen.
 *
 * `action` is typed as a plain `string`, not the `AdminAuditAction` union —
 * the DB column is plain TEXT (see prisma/schema.prisma), and pulling in the
 * *runtime* `ADMIN_AUDIT_ACTIONS` array would drag lib/admin/audit.ts's own
 * `prisma` import into this client bundle. The controlled vocabulary for the
 * action filter dropdown is passed in as a plain string array prop from the
 * server page instead (see app/admin/audit/page.tsx), which already has it
 * safely on the server.
 */

export type SerializedAdminAuditLog = {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reasonCode: string | null;
  note: string | null;
  /** Status-transition snapshot only (see RecordAdminActionInput's doc comment in lib/admin/audit.ts) — never the whole row, never PII/documents. */
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipHash: string | null;
  createdAt: string;
  /** §8.2: present only when this action was taken during an active impersonation session — a meaningfully different kind of row from an admin acting as themselves. */
  impersonationSessionId: string | null;
};

export type AuditLogApiResponse = { logs: SerializedAdminAuditLog[]; nextCursor: string | null };

/** Exact-match / range filters against a controlled vocabulary — not free text (task spec: "a filter bar, not a search box"). */
export type AuditLogFilters = {
  adminUserId?: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  /** `YYYY-MM-DD`, from a native `<input type="date">` — inclusive lower bound on `createdAt`. */
  since?: string;
  /** `YYYY-MM-DD` — inclusive upper bound on `createdAt`. */
  until?: string;
};
