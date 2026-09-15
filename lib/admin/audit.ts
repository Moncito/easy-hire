import type { AdminAuditLog, Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { requireAdminPermission } from "@/lib/admin/permissions";

/**
 * `admin_audit_logs` write/read path — the compliance artefact described in
 * docs/ADMIN-CONSOLE-PLAN.md §8.3. Separate table (and separate reliability
 * contract) from `platform_events`: indefinite retention vs. 90-day hot,
 * different access rules, different legal weight.
 */

/**
 * Runtime whitelist, same shape/discipline as `PLATFORM_EVENT_TYPES` in
 * lib/admin/events.ts and `ADMIN_PERMISSIONS` in lib/admin/permissions.ts —
 * promoted from a plain TS union to a `const` array (Phase 4) purely so
 * `adminAuditLogQuerySchema` (lib/validations/admin.ts) can validate an
 * incoming `action` filter against a real runtime vocabulary via `z.enum`,
 * the same way every other admin-facing filter in this codebase is
 * validated, rather than accepting an arbitrary string. No values changed —
 * this is a mechanical conversion of the same union.
 */
export const ADMIN_AUDIT_ACTIONS = [
  "COMPANY_APPROVE",
  "COMPANY_REJECT",
  "SEEKER_VERIFICATION_APPROVE",
  "SEEKER_VERIFICATION_REJECT",
  "JOB_APPROVE",
  "JOB_REJECT",
  "REVIEW_DISPUTE_RESOLVE",
  "REVIEW_HIDE",
  "ID_DOCUMENT_VIEWED",
  "IMPERSONATE_START",
  "IMPERSONATE_END",
  // Phase 5 impersonation overlay (docs/ADMIN-CONSOLE-PLAN.md §8.2: "every
  // action inside the session audited to admin_audit_logs with the
  // impersonation session id attached"). One row per seeker/employer page
  // rendered under an active impersonation session — a read, not a
  // decision, so this goes through the same fire-and-forget `recordPiiRead`
  // contract as ID_DOCUMENT_VIEWED/USER_RECORD_VIEWED/COMPANY_RECORD_VIEWED
  // above, always carrying `impersonationSessionId`.
  "IMPERSONATED_PAGE_VIEW",
  // Phase 2 (docs/ADMIN-CONSOLE-PLAN.md §4.3) — the 360-degree record and
  // company detail are single-target PII reads, same category as
  // ID_DOCUMENT_VIEWED above (a read, not a decision) — see
  // lib/admin/users.ts's recordPiiRead for why these use the same `after()`
  // reliability contract as ID_DOCUMENT_VIEWED rather than the awaited
  // recordAdminAction contract every decision below uses.
  "USER_RECORD_VIEWED",
  "COMPANY_RECORD_VIEWED",
  // Phase 2 support actions (lib/admin/users.ts's performUserSupportAction) —
  // genuine decisions (a state change or a triggered side effect), so these
  // use the awaited recordAdminAction contract, like every action above.
  "USER_PASSWORD_RESET_TRIGGERED",
  "USER_VERIFICATION_RESEND_TRIGGERED",
  "USER_DELETED_BY_ADMIN",
  // Admin RBAC (docs/ADMIN-CONSOLE-PLAN.md §6.7/§8.1, lib/admin/permissions.ts)
  // — admin-team CRUD. All three are decisions (a state change), so they use
  // the awaited recordAdminAction/buildAdminActionOperation contract, never
  // recordPiiRead's fire-and-forget one.
  "ADMIN_TEAM_PROFILE_CREATED",
  "ADMIN_TEAM_LEVEL_CHANGED",
  "ADMIN_TEAM_PROFILE_REVOKED",
  // Phase 5 — feature flags (docs/ADMIN-CONSOLE-PLAN.md §4.10,
  // lib/admin/feature-flags.ts). All three are decisions (a state change to
  // a flag that can gate real product behaviour), so they use the awaited
  // recordAdminAction contract, never recordPiiRead's fire-and-forget one.
  "FEATURE_FLAG_CREATED",
  "FEATURE_FLAG_UPDATED",
  "FEATURE_FLAG_DELETED",
  // Phase 4 — Trust & Safety, abuse-report resolution
  // (lib/admin/abuse-reports.ts's resolveAbuseReport). Both are decisions (a
  // status transition on `AbuseReport`), so both use the awaited
  // recordAdminAction/buildAdminActionOperation contract, never
  // recordPiiRead's fire-and-forget one — same category as
  // COMPANY_APPROVE/COMPANY_REJECT etc. above, not the PII-read category.
  "ABUSE_REPORT_ACTIONED",
  "ABUSE_REPORT_DISMISSED",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

const ADMIN_AUDIT_ACTION_SET: ReadonlySet<string> = new Set(ADMIN_AUDIT_ACTIONS);

/** Runtime whitelist check, same role as `isAdminPermission` in lib/admin/permissions.ts and `isAbuseTargetType` in lib/admin/abuse-reports.ts. Used by `listAuditLogForAdmin` below to validate an incoming `action` filter — see that function's doc comment for why the Zod schema at the API boundary (`adminAuditLogQuerySchema`, lib/validations/admin.ts) deliberately does NOT `z.enum(ADMIN_AUDIT_ACTIONS)` this itself. */
export function isAdminAuditAction(value: string): value is AdminAuditAction {
  return ADMIN_AUDIT_ACTION_SET.has(value);
}

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
  /**
   * §8.2: "every action inside the [impersonation] session audited to
   * admin_audit_logs with the impersonation session id attached." Omitted
   * (→ `null`) for the common case of an admin acting as themselves — see
   * `AdminAuditLog.impersonationSessionId`'s own doc comment in
   * prisma/schema.prisma for why this is a plain nullable column rather
   * than a required field.
   */
  impersonationSessionId?: string;
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
    impersonationSessionId: input.impersonationSessionId ?? null,
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
export function recordPiiRead(
  adminUserId: string,
  action: AdminAuditAction,
  targetType: string,
  targetId: string,
  options?: {
    /** Threaded through to `RecordAdminActionInput.impersonationSessionId` — see `IMPERSONATED_PAGE_VIEW`'s doc comment above for the call sites that pass this. */
    impersonationSessionId?: string;
  }
): void {
  const write = () =>
    recordAdminAction({
      adminUserId,
      action,
      targetType,
      targetId,
      impersonationSessionId: options?.impersonationSessionId,
    }).catch((error) => {
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
 * Opaque cursor codec, same shape/convention as `encodeQueueCursor` /
 * `decodeQueueCursor` in lib/admin/queues.ts — base64url of a small JSON
 * envelope, never a raw offset.
 */
export function encodeAuditCursor(cursor: AuditCursor): string {
  return Buffer.from(JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }), "utf8").toString(
    "base64url"
  );
}

export function decodeAuditCursor(raw: string): AuditCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.createdAt !== "string" || typeof parsed?.id !== "string") return null;
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

/**
 * Cursor-paginated on (createdAt, id) — never OFFSET, same convention as
 * lib/admin/events.ts's `listEventsForUser`.
 *
 * NOT admin-permission-gated itself. This is the low-level query used by
 * TWO different callers with two different access stories: `getQueueItemDetail`
 * in lib/admin/queue-detail.ts calls it internally (with `targetType`/
 * `targetId` pinned to one specific queue item) from inside a function that
 * is already gated on `document.view` — adding a second, unrelated
 * `audit.read` check there would refuse a MODERATOR the "prior decisions on
 * this item" panel they already have every right to see as part of reviewing
 * it. `listAuditLogForAdmin` below is the gated entry point for the actual
 * `/admin/audit` browse screen (GET /api/admin/audit) — see its own doc
 * comment for why the permission check belongs there instead of here.
 */
export async function listAuditLog({
  adminUserId,
  targetType,
  targetId,
  action,
  since,
  until,
  cursor,
  limit = DEFAULT_AUDIT_LIST_LIMIT,
}: {
  adminUserId?: string;
  targetType?: string;
  targetId?: string;
  action?: AdminAuditAction;
  /** Inclusive lower bound on `createdAt`. */
  since?: Date;
  /** Inclusive upper bound on `createdAt`. */
  until?: Date;
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
      ...(since || until
        ? {
            createdAt: {
              ...(since ? { gte: since } : {}),
              ...(until ? { lte: until } : {}),
            },
          }
        : {}),
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

/**
 * The gated entry point for the `/admin/audit` browse screen
 * (docs/ADMIN-CONSOLE-PLAN.md §4.9), and the ONLY caller allowed to pass an
 * `action` filter sourced from untrusted wire input. Gated on `audit.read`
 * (§8.1's real gate, at the /lib layer — GET /api/admin/audit also calls
 * `requireAdminWithPermission` for defence in depth).
 *
 * `action`, if present, is validated against `ADMIN_AUDIT_ACTIONS` here via
 * `isAdminAuditAction` rather than by `z.enum(ADMIN_AUDIT_ACTIONS)` at the
 * Zod boundary in lib/validations/admin.ts — importing that constant into
 * that file would create an import cycle (validations/admin.ts ->
 * lib/admin/audit.ts -> lib/admin/permissions.ts -> validations/admin.ts,
 * since permissions.ts already imports the admin-team Zod schemas from
 * there for its own CRUD functions). Rejecting an unrecognized action here,
 * at the one call site that actually owns the vocabulary, keeps the
 * boundary honest without introducing the cycle.
 *
 * DELIBERATELY NOT ITSELF AUDITED. Every other admin read that touches one
 * person's private data (`ID_DOCUMENT_VIEWED`, `USER_RECORD_VIEWED`,
 * `COMPANY_RECORD_VIEWED`, `IMPERSONATED_PAGE_VIEW`) writes an audit row,
 * because that is the category of read §8.3 asks to be traceable — someone
 * accessed THIS specific person's PII. Browsing the audit log itself is a
 * different category, the same one `listQueue`/`listAdminTeam` already sit
 * in without an audit row: an aggregate/browse read over operational
 * metadata, not a PII lookup on an individual. Auditing it would also be
 * self-referential noise in the literal sense — a written row that the very
 * next page of the same screen would show, immediately turning "did anyone
 * browse the audit log" into an unbounded, ever-growing answer to its own
 * question.
 */
export async function listAuditLogForAdmin(
  adminUserId: string,
  params: {
    adminUserId?: string;
    targetType?: string;
    targetId?: string;
    action?: string;
    since?: Date;
    until?: Date;
    cursor?: AuditCursor;
    limit?: number;
  }
) {
  await requireAdminPermission(adminUserId, "audit.read");

  if (params.action !== undefined && !isAdminAuditAction(params.action)) {
    throw new ApiError(`Unrecognized audit action: "${params.action}".`, 400);
  }

  return listAuditLog({
    adminUserId: params.adminUserId,
    targetType: params.targetType,
    targetId: params.targetId,
    action: params.action,
    since: params.since,
    until: params.until,
    cursor: params.cursor,
    limit: params.limit,
  });
}
