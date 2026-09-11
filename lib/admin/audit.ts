import type { AdminAuditLog, Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * `admin_audit_logs` write/read path — the compliance artefact described in
 * docs/ADMIN-CONSOLE-PLAN.md §8.3. Separate table (and separate reliability
 * contract) from `platform_events`: indefinite retention vs. 90-day hot,
 * different access rules, different legal weight.
 */

export type AdminAuditAction =
  | "COMPANY_APPROVE"
  | "COMPANY_REJECT"
  | "SEEKER_VERIFICATION_APPROVE"
  | "SEEKER_VERIFICATION_REJECT"
  | "JOB_APPROVE"
  | "JOB_REJECT"
  | "REVIEW_DISPUTE_RESOLVE"
  | "REVIEW_HIDE"
  | "ID_DOCUMENT_VIEWED"
  | "IMPERSONATE_START"
  | "IMPERSONATE_END"
  // Phase 2 (docs/ADMIN-CONSOLE-PLAN.md §4.3) — the 360-degree record and
  // company detail are single-target PII reads, same category as
  // ID_DOCUMENT_VIEWED above (a read, not a decision) — see
  // lib/admin/users.ts's recordPiiRead for why these use the same `after()`
  // reliability contract as ID_DOCUMENT_VIEWED rather than the awaited
  // recordAdminAction contract every decision below uses.
  | "USER_RECORD_VIEWED"
  | "COMPANY_RECORD_VIEWED"
  // Phase 2 support actions (lib/admin/users.ts's performUserSupportAction) —
  // genuine decisions (a state change or a triggered side effect), so these
  // use the awaited recordAdminAction contract, like every action above.
  | "USER_PASSWORD_RESET_TRIGGERED"
  | "USER_VERIFICATION_RESEND_TRIGGERED"
  | "USER_DELETED_BY_ADMIN";

export type RecordAdminActionInput = {
  adminUserId: string;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  reasonCode?: string;
  note?: string;
  /** Status-transition snapshot only (e.g. `{ status: "PENDING" }`) — never the whole row, never PII/documents. */
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipHash?: string;
};

function adminAuditLogCreateData(input: RecordAdminActionInput): Prisma.AdminAuditLogCreateArgs["data"] {
  return {
    adminUserId: input.adminUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    reasonCode: input.reasonCode ?? null,
    note: input.note ?? null,
    before: (input.before as Prisma.InputJsonValue | undefined) ?? undefined,
    after: (input.after as Prisma.InputJsonValue | undefined) ?? undefined,
    ipHash: input.ipHash ?? null,
  };
}

/**
 * Records one admin decision, standalone. Reliability contract is the
 * OPPOSITE of `recordEvent` in lib/admin/events.ts: this one IS awaited by
 * its caller and IS allowed to throw. An admin decision that cannot be
 * audited must not silently proceed — the audit trail is the compliance
 * artefact (§8.3 of the plan) — so do not wrap this call in a try/catch
 * that swallows the error, here or at any call site.
 *
 * Use this only when the decision it records is NOT itself written inside
 * a `prisma.$transaction` (e.g. `ID_DOCUMENT_VIEWED`, and later
 * `IMPERSONATE_START`/`IMPERSONATE_END`). When the decision IS transactional
 * (the four admin review/resolve paths), use `buildAdminActionOperation`
 * instead and put it in the same `$transaction([...])` array — otherwise
 * the decision can commit while the audit write fails independently,
 * leaving an unaudited state change, which is exactly what the audit trail
 * exists to prevent.
 */
export async function recordAdminAction(input: RecordAdminActionInput): Promise<AdminAuditLog> {
  return prisma.adminAuditLog.create({ data: adminAuditLogCreateData(input) });
}

/**
 * Same field mapping as `recordAdminAction`, but returns the un-awaited
 * `Prisma.PrismaPromise` instead of awaiting it — for dropping into an
 * existing `prisma.$transaction([...])` array alongside the decision it
 * records, so the audit write is atomic with the decision: either both land
 * or neither does. Append it to the END of the array so any existing
 * `const [x] = await prisma.$transaction([...])` destructuring by position
 * keeps pointing at the same element.
 *
 * `client` defaults to the top-level `prisma` client, which is correct for
 * the array form of `$transaction`. Pass the callback's `tx` instead when
 * building this inside an interactive `prisma.$transaction(async (tx) => ...)`
 * — e.g. when the decision is a conditional `updateMany` and the audit row
 * must only be created if it actually matched a row (see
 * `resolveDisputedReview` in lib/reviews.ts).
 */
export function buildAdminActionOperation(
  input: RecordAdminActionInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
): Prisma.PrismaPromise<AdminAuditLog> {
  return client.adminAuditLog.create({ data: adminAuditLogCreateData(input) });
}

/**
 * Shared PII-read audit helper — same reliability contract as the original
 * `recordDocumentViewed` in lib/admin/queue-detail.ts (which still owns its
 * own private copy for `ID_DOCUMENT_VIEWED`, unchanged): `after()` so the
 * write happens post-response without blocking the read it's attached to,
 * with a bare-promise fallback for a caller with no request scope (a script
 * or a test). Promoted here, rather than living in lib/admin/users.ts alone,
 * because Phase 2 needs the exact same contract from two different modules —
 * `getUserRecord` (lib/admin/users.ts, `USER_RECORD_VIEWED`) and
 * `getCompanyDetail` (lib/admin/companies.ts, `COMPANY_RECORD_VIEWED`) — and
 * `lib/admin/audit.ts` is the module both already depend on.
 *
 * Use this for READS only. A decision (a state transition) must still go
 * through the awaited `recordAdminAction`/`buildAdminActionOperation` above,
 * per their own doc comments.
 */
export function recordPiiRead(adminUserId: string, action: AdminAuditAction, targetType: string, targetId: string): void {
  const write = () =>
    recordAdminAction({ adminUserId, action, targetType, targetId }).catch((error) => {
      console.error(`[admin/audit] failed to record ${action} for ${targetType}:${targetId}:`, error);
    });

  try {
    after(write);
  } catch {
    void write();
  }
}

// ============================================================================
// Read path — no update/delete is exported for this model, on purpose.
// Audit rows are never edited or removed.
// ============================================================================

export type AuditCursor = { createdAt: Date; id: string };

const DEFAULT_AUDIT_LIST_LIMIT = 50;
const MAX_AUDIT_LIST_LIMIT = 200;

/**
 * Cursor-paginated on (createdAt, id) — never OFFSET, same convention as
 * lib/admin/events.ts's `listEventsForUser`.
 */
export async function listAuditLog({
  adminUserId,
  targetType,
  targetId,
  action,
  cursor,
  limit = DEFAULT_AUDIT_LIST_LIMIT,
}: {
  adminUserId?: string;
  targetType?: string;
  targetId?: string;
  action?: AdminAuditAction;
  cursor?: AuditCursor;
  limit?: number;
}) {
  const boundedLimit = Math.min(Math.max(limit, 1), MAX_AUDIT_LIST_LIMIT);

  const logs = await prisma.adminAuditLog.findMany({
    where: {
      ...(adminUserId ? { adminUserId } : {}),
      ...(targetType ? { targetType } : {}),
      ...(targetId ? { targetId } : {}),
      ...(action ? { action } : {}),
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: boundedLimit + 1,
  });

  const hasMore = logs.length > boundedLimit;
  const page = hasMore ? logs.slice(0, boundedLimit) : logs;
  const last = page[page.length - 1];

  return {
    logs: page,
    nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
  };
}
