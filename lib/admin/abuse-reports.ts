import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { recordEvent } from "@/lib/admin/events";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { buildAdminActionOperation } from "@/lib/admin/audit";
import { adminAbuseReportResolveSchema } from "@/lib/validations/admin";
import type { QueueCursor, QueueStatus } from "@/lib/admin/queues";

/**
 * ABUSE REPORTS — docs/ADMIN-CONSOLE-PLAN.md §4.8/§6.6, Phase 4 (Trust &
 * Safety). `AbuseReport` already exists (Sprint 10, see prisma/schema.prisma)
 * with every column this module needs — NO SCHEMA CHANGE HERE, and none is
 * needed: `reason`/`status`/`targetType` are plain TEXT columns by design
 * (same "controlled vocabulary, not a Postgres enum" discipline as
 * lib/admin/reason-codes.ts — adding a reason later is a one-line change to
 * the arrays below, never a migration).
 * ============================================================================
 * This module owns the ENTIRE abuse-report lifecycle:
 *   - the reporter-facing controlled reason vocabularies (one per target
 *     type — a fake job is not the same shape of problem as harassment in a
 *     message or an impersonating profile) and their initial severity
 *   - `fileAbuseReport` — the ONE function in lib/admin/* that is NOT
 *     admin-gated (see its own doc comment, verbatim, so nobody "fixes" that
 *     later by adding a permission check)
 *   - `listAbuseReports` / `getAbuseReportDetail` — raw, unranked admin reads
 *     that lib/admin/queues.ts's `listReportQueue` and
 *     lib/admin/queue-detail.ts's `getReportQueueItemDetail` layer the
 *     shared risk-ranking/document-viewer conventions on top of, exactly the
 *     same "one fetch, then batch signals" split every other queue kind uses
 *   - `resolveAbuseReport` — the admin decision (ACTIONED/DISMISSED), gated
 *     on `queue.decide` and reused UNCHANGED by lib/admin/bulk.ts, same as
 *     the four pre-existing decision functions
 *
 * TARGET TYPES — the documented, exhaustive set (also the DB comment on
 * `AbuseReport.targetType`): USER | JOB | COMPANY | MESSAGE | REVIEW. Every
 * one of these maps to exactly one existing Prisma model with the same name
 * (User/Job/Company/Message/Review) — reports never target anything else.
 */

export const ABUSE_TARGET_TYPES = ["USER", "JOB", "COMPANY", "MESSAGE", "REVIEW"] as const;

export type AbuseTargetType = (typeof ABUSE_TARGET_TYPES)[number];

const ABUSE_TARGET_TYPE_SET: ReadonlySet<string> = new Set(ABUSE_TARGET_TYPES);

export function isAbuseTargetType(value: string): value is AbuseTargetType {
  return ABUSE_TARGET_TYPE_SET.has(value);
}

/** Mirrors `AbuseReport.status`'s documented values (see prisma/schema.prisma). */
export type AbuseReportStatus = "OPEN" | "ACTIONED" | "DISMISSED";

// ============================================================================
// Reporter-facing reason vocabularies — one per target type, same "plain
// TEXT, never a Postgres enum" discipline as lib/admin/reason-codes.ts.
// Severity lives INLINE on each entry (not a second, separately-maintained
// object) so there is exactly one place that can drift out of sync between
// "what this reason means" and "how serious it starts out" — the single
// source of truth TRUST_WEIGHTS (lib/admin/trust.ts) and QUEUE_RANKING
// (lib/admin/queues.ts) both already establish for their own weights.
//
// USER and COMPANY share ACCOUNT_ABUSE_REPORT_REASONS — both are "an
// account", and the failure modes reported against them (impersonation,
// scams, harassment, spam) are identical in kind. JOB, MESSAGE, and REVIEW
// each get their own vocabulary because the failure modes genuinely differ
// (a fake job posting vs. harassment in a DM vs. a fabricated review is not
// the same axis of "how bad is this").
// ============================================================================

export type AbuseReasonEntry = { readonly code: string; readonly label: string; readonly severity: number };

const ACCOUNT_ABUSE_REPORT_REASONS: readonly AbuseReasonEntry[] = [
  { code: "SCAM_OR_FRAUD", label: "Requesting payment, running a scam, or other fraudulent behavior", severity: 5 },
  { code: "FAKE_PROFILE", label: "This account is fake or impersonating someone else", severity: 4 },
  { code: "HARASSMENT", label: "Harassing or abusive behavior toward another user", severity: 4 },
  { code: "SPAM", label: "Spam, promotional content, or off-platform solicitation", severity: 2 },
  { code: "INAPPROPRIATE_CONTENT", label: "Profile contains inappropriate or offensive content", severity: 2 },
  { code: "OTHER", label: "Other (see details)", severity: 1 },
];

const JOB_ABUSE_REPORT_REASONS: readonly AbuseReasonEntry[] = [
  { code: "SCAM_OR_UPFRONT_FEE", label: "Requires payment or personal financial info from applicants", severity: 5 },
  { code: "FAKE_JOB", label: "This job posting appears to be fake or does not exist", severity: 4 },
  { code: "DISCRIMINATORY", label: "Contains discriminatory requirements or language", severity: 3 },
  { code: "MISLEADING", label: "Pay or job details are misleading", severity: 2 },
  { code: "SPAM_DUPLICATE", label: "Spam or duplicate posting", severity: 1 },
  { code: "OTHER", label: "Other (see details)", severity: 1 },
];

const MESSAGE_ABUSE_REPORT_REASONS: readonly AbuseReasonEntry[] = [
  { code: "HARASSMENT_OR_ABUSE", label: "Harassment, threats, or abusive language", severity: 5 },
  { code: "SEXUAL_CONTENT", label: "Unwanted sexual content", severity: 5 },
  { code: "SCAM_OR_PHISHING", label: "Scam, phishing, or requests for payment or personal info", severity: 4 },
  { code: "OFF_PLATFORM_SOLICITATION", label: "Pushing to communicate or pay off-platform", severity: 2 },
  { code: "SPAM", label: "Spam or unsolicited advertising", severity: 2 },
  { code: "OTHER", label: "Other (see details)", severity: 1 },
];

const REVIEW_ABUSE_REPORT_REASONS: readonly AbuseReasonEntry[] = [
  { code: "DEFAMATORY_OR_ABUSIVE", label: "Contains defamatory, abusive, or harassing content", severity: 4 },
  { code: "CONTAINS_PII", label: "Reveals personal information about someone", severity: 3 },
  { code: "FAKE_OR_FRAUDULENT", label: "Review appears fake or not based on a real interaction", severity: 3 },
  { code: "RETALIATORY", label: "Review is retaliatory rather than a genuine account of the interaction", severity: 2 },
  { code: "OTHER", label: "Other (see details)", severity: 1 },
];

export const ABUSE_REPORT_REASONS_BY_TARGET_TYPE: Record<AbuseTargetType, readonly AbuseReasonEntry[]> = {
  USER: ACCOUNT_ABUSE_REPORT_REASONS,
  COMPANY: ACCOUNT_ABUSE_REPORT_REASONS,
  JOB: JOB_ABUSE_REPORT_REASONS,
  MESSAGE: MESSAGE_ABUSE_REPORT_REASONS,
  REVIEW: REVIEW_ABUSE_REPORT_REASONS,
};

function reasonEntry(targetType: AbuseTargetType, reason: string): AbuseReasonEntry | undefined {
  return ABUSE_REPORT_REASONS_BY_TARGET_TYPE[targetType].find((entry) => entry.code === reason);
}

/** Pure — DB-free. The Zod boundary (lib/validations/reports.ts's `reportFileSchema`) already enforces this; `fileAbuseReport` re-checks it as its own defence-in-depth, same discipline as every other lib/admin/* decision re-validating what its route already validated. */
export function isValidAbuseReportReason(targetType: AbuseTargetType, reason: string): boolean {
  return reasonEntry(targetType, reason) !== undefined;
}

/**
 * Pure — DB-free. Falls back to `1` (the lowest severity) for an
 * unrecognized (targetType, reason) pair rather than throwing — callers that
 * care about rejecting an invalid reason outright use
 * `isValidAbuseReportReason` first (as `fileAbuseReport` does); this function
 * alone must never throw, since lib/admin/queues.ts's ranking path also
 * calls it defensively against historical rows.
 */
export function severityForReason(targetType: AbuseTargetType, reason: string): number {
  return reasonEntry(targetType, reason)?.severity ?? 1;
}

// ============================================================================
// Dedup rule — pure, DB-free (same "take a pre-resolved input, decide" shape
// as lib/admin/permissions.ts's assertLastSuperAdminSafe).
//
// RULE: at most one OPEN report per (reporterUserId, targetType, targetId).
// A reporter re-filing against a target they already have an OPEN report
// against does NOT create a second queue row — it bumps the existing
// report's severity to the max of the two (a follow-up citing a MORE
// serious reason should not be silently ignored), but keeps the original
// `reason`/`detail` content, since that is what a moderator has (or hasn't)
// already started reviewing.
//
// WHY this rule, not "always create": an unthrottled duplicate-report path
// is both a harassment vector against the reported party (inflating how
// "reported" they look) and a queue-spam vector (N rows for one underlying
// complaint, N times the reviewer's time) — the exact failure mode
// `enforceRateLimit` guards on the frequency axis, this guards on the
// "same complaint, filed again" axis.
//
// WHY scoped to OPEN, not "ever": once a report is resolved (ACTIONED or
// DISMISSED), a NEW filing against the same target by the same reporter is
// allowed to open a fresh row — e.g. renewed abuse after a prior report was
// actioned, or new evidence after a prior one was dismissed. Only an
// unresolved, still-open complaint is deduplicated.
//
// WHY this does NOT dedupe across DIFFERENT reporters: a second, third,
// fourth independent reporter filing against the very same target is a
// genuine, valuable signal (see `multipleReporters` in
// lib/admin/queues.ts's REPORT ranking) — only same-reporter-same-target
// repetition is noise.
//
// CONCURRENCY NOTE: there is no unique DB constraint enforcing "one OPEN row
// per (reporterUserId, targetType, targetId)" — `AbuseReport` predates this
// module (Sprint 10) and no schema change is permitted here. A race between
// two near-simultaneous requests from the same reporter against the same
// target could in theory both pass the "no existing OPEN report" check and
// both insert. This is an accepted, low-probability gap (not a financial or
// security-critical operation — worst case is one extra queue row that a
// moderator resolves as a duplicate), not silently unconsidered.
// ============================================================================

export type AbuseReportDedupOutcome =
  | { action: "create" }
  | { action: "bump"; reportId: string; severity: number };

export function resolveAbuseReportDedup(input: {
  existingOpenReport: { id: string; severity: number } | null;
  newSeverity: number;
}): AbuseReportDedupOutcome {
  if (!input.existingOpenReport) {
    return { action: "create" };
  }
  return {
    action: "bump",
    reportId: input.existingOpenReport.id,
    severity: Math.max(input.existingOpenReport.severity, input.newSeverity),
  };
}

/** Pure — DB-free. Takes the already-resolved existence check (see `targetExists` below) as a plain boolean, same "resolve the DB read, then decide" split as `assertLastSuperAdminSafe`/`assertSelfTeamActionAllowed` in lib/admin/permissions.ts. */
export function assertAbuseReportTargetExists(exists: boolean, targetType: AbuseTargetType, targetId: string): void {
  if (!exists) {
    throw new ApiError(`No ${targetType.toLowerCase()} found with id "${targetId}" to report.`, 404);
  }
}

async function targetExists(targetType: AbuseTargetType, targetId: string): Promise<boolean> {
  switch (targetType) {
    case "USER":
      return (await prisma.user.count({ where: { id: targetId } })) > 0;
    case "JOB":
      return (await prisma.job.count({ where: { id: targetId } })) > 0;
    case "COMPANY":
      return (await prisma.company.count({ where: { id: targetId } })) > 0;
    case "MESSAGE":
      return (await prisma.message.count({ where: { id: targetId } })) > 0;
    case "REVIEW":
      return (await prisma.review.count({ where: { id: targetId } })) > 0;
  }
}

// ============================================================================
// fileAbuseReport
// ============================================================================

export type FileAbuseReportInput = {
  reporterUserId: string;
  targetType: AbuseTargetType;
  targetId: string;
  reason: string;
  detail?: string;
};

export type FiledAbuseReport = { id: string; status: AbuseReportStatus; severity: number };

/** Kept in sync with lib/validations/reports.ts's `reportFileSchema` cap — enforced again here so any future non-HTTP caller of this function (a script, a queued job) still gets the bound, not just the route. */
const ABUSE_REPORT_DETAIL_MAX_LENGTH = 2000;

/**
 * Files an abuse report against a USER, JOB, COMPANY, MESSAGE, or REVIEW.
 *
 * *** THIS IS THE ONE FUNCTION IN lib/admin/* THAT IS NOT ADMIN-GATED. ***
 * Any signed-in user may call this — reporting abuse is a platform-wide
 * safety feature, not an admin action, and gating it on an admin permission
 * would defeat its entire purpose. Do not "fix" this later by adding a
 * `requireAdminPermission`/`requireAdmin` call here.
 *
 * NOT RATE-LIMITED HERE. Rate limiting requires the raw `Request` (for the
 * IP-fallback branch of `clientKeyFromRequest` when a session id isn't
 * enough on its own), which is deliberately not part of this function's
 * signature — this is `/lib` business logic, not a route handler (CLAUDE.md).
 * The caller — `POST /api/reports` (app/api/reports/route.ts) — enforces
 * `enforceRateLimit`/`clientKeyFromRequest` BEFORE calling this function,
 * exactly the same convention every other authenticated, spam-prone POST
 * endpoint in this codebase already follows (see e.g. `POST /api/reviews`,
 * `POST /api/conversations`, `POST /api/applications`) — rate limiting is a
 * request-layer concern here, not a `/lib` one. There is exactly one call
 * site today; if a second one is ever added, it must rate-limit too.
 *
 * Validates `targetType`/`reason` against the documented vocabularies (see
 * this module's header comment), verifies the target actually exists
 * (`assertAbuseReportTargetExists`) so a report against a nonexistent id can
 * never become moderation-queue noise, applies the dedup rule
 * (`resolveAbuseReportDedup`), and records `REPORT_FILED` — ids and enums
 * only in metadata, NEVER `detail` (user-authored free text; would put PII
 * into `platform_events.metadata`, exactly the thing §8.3 forbids).
 */
export async function fileAbuseReport(input: FileAbuseReportInput): Promise<FiledAbuseReport> {
  const { reporterUserId, targetType, targetId, reason } = input;
  const detail = input.detail?.trim() || null;

  if (!isAbuseTargetType(targetType)) {
    throw new ApiError(`Unrecognized report target type: "${targetType}".`, 400);
  }
  if (!isValidAbuseReportReason(targetType, reason)) {
    throw new ApiError(`Unrecognized report reason "${reason}" for target type ${targetType}.`, 400);
  }
  if (detail && detail.length > ABUSE_REPORT_DETAIL_MAX_LENGTH) {
    throw new ApiError(`Detail is too long (${ABUSE_REPORT_DETAIL_MAX_LENGTH} characters maximum).`, 400);
  }

  assertAbuseReportTargetExists(await targetExists(targetType, targetId), targetType, targetId);

  const severity = severityForReason(targetType, reason);

  const existingOpenReport = await prisma.abuseReport.findFirst({
    where: { reporterUserId, targetType, targetId, status: "OPEN" },
    select: { id: true, severity: true },
  });

  const dedup = resolveAbuseReportDedup({ existingOpenReport, newSeverity: severity });

  const report =
    dedup.action === "bump"
      ? await prisma.abuseReport.update({
          where: { id: dedup.reportId },
          data: { severity: dedup.severity },
          select: { id: true, status: true, severity: true },
        })
      : await prisma.abuseReport.create({
          data: { reporterUserId, targetType, targetId, reason, detail, severity },
          select: { id: true, status: true, severity: true },
        });

  // actorType for the platform event — a cheap, indexed PK lookup, not a
  // signal used anywhere else in this function.
  const reporter = await prisma.user.findUnique({ where: { id: reporterUserId }, select: { role: true } });
  const actorType = reporter?.role === "EMPLOYER" ? "EMPLOYER" : reporter?.role === "ADMIN" ? "ADMIN" : "SEEKER";

  // Fire-and-forget, never awaited, never inside a transaction (there isn't
  // one here) — per recordEvent's own contract in lib/admin/events.ts.
  // metadata is ids/enums ONLY: `reason` is a controlled vocabulary code
  // (not free text), `severity`/`dedup` are numbers/enums. `detail` is
  // deliberately never included — see this function's own doc comment.
  recordEvent({
    eventType: "REPORT_FILED",
    actorType,
    userId: reporterUserId,
    entityType: targetType,
    entityId: targetId,
    metadata: { reportId: report.id, reason, severity: report.severity, targetType, dedup: dedup.action },
  });

  return { id: report.id, status: report.status as AbuseReportStatus, severity: report.severity };
}

// ============================================================================
// Admin reads — raw, UNRANKED, cursor-paginated. NOT self-gated on a
// permission (mirrors listCompanyQueue/listJobQueue/listSeekerQueue/
// listReviewQueue in lib/admin/queues.ts, and the per-kind fetchers behind
// getQueueItemDetail in lib/admin/queue-detail.ts) — the caller is where
// `queue.decide`/`document.view` is actually enforced:
//   - lib/admin/queues.ts's `listReportQueue` calls `listAbuseReports` for
//     the base page, then layers severity/reach ranking on top (same "one
//     fetch, then batch signals" split every other kind already uses); its
//     caller, GET /api/admin/queues, gates on `queue.decide`.
//   - lib/admin/queue-detail.ts's `getReportQueueItemDetail` calls
//     `getAbuseReportDetail`; its caller, `getQueueItemDetail`'s dispatcher,
//     gates on `document.view` once for all five kinds.
// ============================================================================

export type AbuseReportRow = {
  id: string;
  reporterUserId: string;
  targetType: AbuseTargetType;
  targetId: string;
  reason: string;
  detail: string | null;
  status: AbuseReportStatus;
  severity: number;
  resolvedByUserId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

function toAbuseReportRow(row: {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetId: string;
  reason: string;
  detail: string | null;
  status: string;
  severity: number;
  resolvedByUserId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}): AbuseReportRow {
  return {
    id: row.id,
    reporterUserId: row.reporterUserId,
    // Plain TEXT columns at the schema level (see prisma/schema.prisma's
    // AbuseReport comment) — every row here was written through
    // `fileAbuseReport`, which only ever accepts a validated
    // AbuseTargetType/AbuseReportStatus. Cast at the boundary, same
    // precedent as `AdminAuditLog.action` elsewhere in lib/admin/*.
    targetType: row.targetType as AbuseTargetType,
    targetId: row.targetId,
    reason: row.reason,
    detail: row.detail,
    status: row.status as AbuseReportStatus,
    severity: row.severity,
    resolvedByUserId: row.resolvedByUserId,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
  };
}

const DEFAULT_ABUSE_REPORT_LIST_LIMIT = 25;
const MAX_ABUSE_REPORT_LIST_LIMIT = 100;

/** Maps the shared `QueueStatus` vocabulary onto `AbuseReport.status`'s own values — same shape as lib/admin/queues.ts's `jobQueueStatusWhere`/`reviewQueueStatusWhere`. */
function abuseReportQueueStatusWhere(status?: QueueStatus): Prisma.AbuseReportWhereInput {
  if (status === "PENDING") return { status: "OPEN" };
  if (status === "APPROVED") return { status: "ACTIONED" };
  if (status === "REJECTED") return { status: "DISMISSED" };
  return {};
}

export type ListAbuseReportsParams = {
  status?: QueueStatus;
  search?: string;
  cursor?: QueueCursor;
  limit?: number;
};

export type AbuseReportListResult = { reports: AbuseReportRow[]; nextCursor: QueueCursor | null };

/**
 * Cursor-paginated on (createdAt, id) — never OFFSET, same convention as
 * every other list in lib/admin/*.
 *
 * CURSOR NOTE: `AbuseReport` has no `updatedAt` column (it is filed once and
 * transitions status at most once — see prisma/schema.prisma). The shared
 * `QueueCursor` shape's `updatedAt` field is therefore populated from
 * `createdAt` here, exactly as JOB already diverges its cursor/sort key
 * (`updatedAt`) from its DISPLAY age (`pendingReviewAt`) in
 * lib/admin/queues.ts's `listJobQueue` — same kind of divergence, just
 * because the column doesn't exist at all here rather than being nullable.
 */
export async function listAbuseReports(params: ListAbuseReportsParams): Promise<AbuseReportListResult> {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_ABUSE_REPORT_LIST_LIMIT, 1), MAX_ABUSE_REPORT_LIST_LIMIT);

  const where: Prisma.AbuseReportWhereInput = {
    ...abuseReportQueueStatusWhere(params.status),
    ...(params.search
      ? {
          OR: [
            { reason: { contains: params.search, mode: "insensitive" } },
            { detail: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.cursor
      ? {
          OR: [
            { createdAt: { gt: params.cursor.updatedAt } },
            { createdAt: params.cursor.updatedAt, id: { gt: params.cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await prisma.abuseReport.findMany({
    where,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    reports: page.map(toAbuseReportRow),
    nextCursor: hasMore && last ? { updatedAt: last.createdAt, id: last.id } : null,
  };
}

export type AbuseReportDetail = AbuseReportRow & {
  reporterEmail: string | null;
  /** Distinct reporters who have EVER filed against this exact (targetType, targetId), across every status — not just currently-OPEN ones. See lib/admin/queues.ts's `multipleReporters` severity signal for why a dismissed-but-recurring complaint still counts. */
  distinctReporterCount: number;
  /** Bounded, most-recent-first — context for the reviewer, not a full history browser (same precedent as lib/admin/queue-detail.ts's `PRIOR_DECISIONS_TAKE`). */
  otherReportsForTarget: AbuseReportRow[];
};

const OTHER_REPORTS_FOR_TARGET_TAKE = 10;

export async function getAbuseReportDetail(reportId: string): Promise<AbuseReportDetail> {
  const report = await prisma.abuseReport.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new ApiError("Abuse report not found", 404);
  }

  const [reporter, otherReports, distinctReporters] = await Promise.all([
    prisma.user.findUnique({ where: { id: report.reporterUserId }, select: { email: true } }),
    prisma.abuseReport.findMany({
      where: { targetType: report.targetType, targetId: report.targetId, id: { not: report.id } },
      orderBy: { createdAt: "desc" },
      take: OTHER_REPORTS_FOR_TARGET_TAKE,
    }),
    prisma.abuseReport.findMany({
      where: { targetType: report.targetType, targetId: report.targetId },
      select: { reporterUserId: true },
      distinct: ["reporterUserId"],
    }),
  ]);

  return {
    ...toAbuseReportRow(report),
    reporterEmail: reporter?.email ?? null,
    distinctReporterCount: distinctReporters.length,
    otherReportsForTarget: otherReports.map(toAbuseReportRow),
  };
}

// ============================================================================
// resolveAbuseReport — the admin decision. Reused UNCHANGED by
// lib/admin/bulk.ts's `bulkReviewQueueItems`, same as the four pre-existing
// decision functions (reviewCompany/reviewJob/reviewSeekerVerification/
// resolveDisputedReview).
//
// Signature deliberately matches the (adminUserId, targetId, raw) triple
// every one of those four functions already uses — NOT the
// `{ adminUserId, reportId, status, reasonCode, note? }` object-destructured
// shape one might otherwise reach for — precisely so lib/admin/bulk.ts's
// `dispatchDecision` can call all five kinds through the identical calling
// convention with no fifth special case (the task's own "thread REPORT
// through consistently... rather than growing a special case").
// `adminAbuseReportResolveSchema` (lib/validations/admin.ts) is the `raw`
// parser, with `status: "ACTIONED" | "DISMISSED"` as its `action`-equivalent
// field.
// ============================================================================

export async function resolveAbuseReport(adminUserId: string, reportId: string, raw: unknown): Promise<AbuseReportRow> {
  // Gated here, not only at the route (§8.1) — also the dispatch target for
  // lib/admin/bulk.ts's `bulkReviewQueueItems` (REPORT kind).
  await requireAdminPermission(adminUserId, "queue.decide");

  const input = adminAbuseReportResolveSchema.parse(raw);

  // Interactive (not array-form) transaction, same reason as
  // `resolveDisputedReview` in lib/reviews.ts: the `updateMany` below is
  // conditional (guards a double-click / already-resolved race) and must
  // NOT produce an audit row when it matches zero rows — the array form of
  // `$transaction` would run the audit insert unconditionally regardless of
  // the update's result.
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.abuseReport.updateMany({
      where: { id: reportId, status: "OPEN" },
      data: { status: input.status, resolvedByUserId: adminUserId, resolvedAt: new Date() },
    });
    if (result.count === 0) {
      return result;
    }
    await buildAdminActionOperation(
      {
        adminUserId,
        action: input.status === "ACTIONED" ? "ABUSE_REPORT_ACTIONED" : "ABUSE_REPORT_DISMISSED",
        targetType: "ABUSE_REPORT",
        targetId: reportId,
        reasonCode: input.reasonCode,
        note: input.note?.trim() || undefined,
        before: { status: "OPEN" },
        after: { status: input.status },
      },
      tx
    );
    return result;
  });

  if (updated.count === 0) {
    throw new ApiError("Only an open report can be resolved.", 400);
  }

  // NOT fed back into trustScore from here. lib/admin/trust.ts's nightly
  // recompute already reads `AbuseReport` rows with `status: 'ACTIONED'`
  // directly (see `recomputeSeekerTrustScoresBatch`/
  // `recomputeEmployerTrustScoresBatch`'s own `abuseRows` query, keyed on
  // `targetType: 'USER'`/`targetType: 'COMPANY'`) for whichever account this
  // report's target resolves to. Adding a second, immediate trust-score
  // write here would double-count the very report just ACTIONED the next
  // time the nightly sweep runs. If an immediate (same-day) refresh is ever
  // wanted, `recomputeTrustScore` (lib/admin/trust.ts) already exists for
  // that — this function deliberately does not call it, so there remains
  // exactly one path that turns "ACTIONED abuse reports" into a trust-score
  // delta. (A report targeting JOB/MESSAGE/REVIEW never feeds trust at all,
  // before or after this change — those target types aren't themselves
  // trust-scored entities; only the SeekerProfile/Company behind a USER or
  // COMPANY report is.)
  return toAbuseReportRow(await prisma.abuseReport.findUniqueOrThrow({ where: { id: reportId } }));
}
