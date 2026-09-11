import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * `platform_events` write path — the activity pipeline described in
 * docs/ADMIN-CONSOLE-PLAN.md §7.1/§7.2.
 *
 * `PlatformEvent` is a partitioned, append-only table with a COMPOSITE
 * primary key (`@@id([id, createdAt])` — see prisma/schema.prisma) because
 * Postgres requires the partition key in every unique constraint on a
 * partitioned table. There is no `findUnique({ where: { id } })` on this
 * model and there must never be one added here — the table is never read by
 * id alone, only by (userId, createdAt), (eventType, createdAt), or
 * (entityType, entityId).
 */

// ============================================================================
// Whitelist — docs/ADMIN-CONSOLE-PLAN.md §7.1. Nothing outside this list may
// be recorded. Grouped exactly as the plan groups them, for easy diffing
// against the doc if the vocabulary ever grows.
// ============================================================================
export const PLATFORM_EVENT_TYPES = [
  // Auth
  "USER_SIGNED_UP",
  "USER_LOGGED_IN",
  "USER_LOGIN_FAILED",
  "USER_LOGGED_OUT",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_CHANGED",
  // Seeker
  "PROFILE_CREATED",
  "PROFILE_UPDATED",
  "RESUME_UPLOADED",
  "ID_DOC_UPLOADED",
  "JOB_APPLIED",
  "APPLICATION_WITHDRAWN",
  "JOB_SAVED",
  "ALERT_CREATED",
  "PROFILE_VISIBILITY_CHANGED",
  // Employer
  "COMPANY_CREATED",
  "COMPANY_UPDATED",
  "VERIFICATION_SUBMITTED",
  "JOB_CREATED",
  "JOB_SUBMITTED",
  "JOB_PUBLISHED",
  "JOB_CLOSED",
  "JOB_FEATURED",
  "APPLICATION_STATUS_CHANGED",
  "INTERVIEW_SCHEDULED",
  "CANDIDATE_HIRED",
  "MEMBER_INVITED",
  "TALENT_EXPORTED",
  "AI_FEATURE_USED",
  // Both sides
  "MESSAGE_SENT",
  "CONVERSATION_STARTED",
  "REVIEW_SUBMITTED",
  "REVIEW_DISPUTED",
  "REPORT_FILED",
  // Billing
  "CHECKOUT_STARTED",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_CANCELLED",
  "PAYMENT_SUCCEEDED",
  "PAYMENT_FAILED",
  // System
  "CRON_RUN",
  "EMAIL_SENT",
  "EMAIL_BOUNCED",
  "RATE_LIMIT_HIT",
] as const;

export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

const PLATFORM_EVENT_TYPE_SET: ReadonlySet<string> = new Set(PLATFORM_EVENT_TYPES);

export type ActorType = "SEEKER" | "EMPLOYER" | "ADMIN" | "SYSTEM";

/**
 * ids and enums only — never names, emails, message bodies, or any other
 * payload. Same precedent as `ExportAuditLog.meta` in prisma/schema.prisma
 * (see `platform_events.metadata` there) and §8.3 of the plan.
 */
export type PlatformEventMetadata = Record<string, string | number | boolean | null>;

export type RecordEventInput = {
  eventType: PlatformEventType;
  actorType: ActorType;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: PlatformEventMetadata;
  ipHash?: string;
  userAgent?: string;
};

/**
 * Fire-and-forget event write. Deliberately returns `void`, not a Promise —
 * callers must not (and cannot) `await` this. The insert is dispatched and
 * a `.catch()` swallows and logs any failure so a broken analytics write can
 * never fail the job application / message / whatever it's describing.
 *
 * Reliability contract is the OPPOSITE of `recordAdminAction` in
 * lib/admin/audit.ts: that one is awaited and allowed to throw, this one
 * never is and never can.
 *
 * MUST NOT be called from inside a `prisma.$transaction` — an event write
 * must not extend a lock held by the caller's transaction (see
 * .agents/skills/supabase-postgres-best-practices/references/lock-short-transactions.md).
 * Call it after the transaction commits, not inside the array/callback
 * passed to `$transaction`.
 *
 * MUST NOT be called from a route handler — this is `/lib` business logic
 * per CLAUDE.md; call it from the `/lib` function performing the action.
 */
export function recordEvent(input: RecordEventInput): void {
  if (!PLATFORM_EVENT_TYPE_SET.has(input.eventType)) {
    // Should be unreachable given the PlatformEventType union, but this is
    // the actual enforcement of "whitelist, nothing else may be recorded" —
    // the TS type only stops well-typed callers, not a stray string.
    console.error(`[admin/events] refused to record event outside the §7.1 whitelist: "${input.eventType}"`);
    return;
  }

  void prisma.platformEvent
    .create({
      data: {
        eventType: input.eventType,
        actorType: input.actorType,
        userId: input.userId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        ipHash: input.ipHash ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
    .catch((error) => {
      console.error(`[admin/events] failed to record "${input.eventType}":`, error);
    });
}

/**
 * Derives a hashed IP from a request's `x-forwarded-for` (first hop,
 * trimmed) falling back to `x-real-ip` — same extraction as
 * lib/shared/rate-limit.ts's `clientKeyFromRequest`. Hashing reuses the
 * sha256-then-truncate approach already used for `sessionHash` in
 * lib/employer/analytics.ts's `getSessionHashFromRequest` (that helper
 * hashes IP+user-agent together into a session identifier; this one hashes
 * the IP alone, since `PlatformEvent.ipHash` and `AdminAuditLog.ipHash` are
 * separate fields from `userAgent`). The raw IP is never stored.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export function getIpHashFromRequest(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const firstHop = forwardedFor?.split(",")[0]?.trim();
  const ip = firstHop || req.headers.get("x-real-ip")?.trim() || "unknown";
  return hashIp(ip);
}

// ============================================================================
// Read path
// ============================================================================

export type EventCursor = { createdAt: Date; id: string };

const DEFAULT_EVENT_LIST_LIMIT = 50;
const MAX_EVENT_LIST_LIMIT = 200;

/**
 * Opaque cursor codec for `EventCursor` — same base64url-JSON pattern as
 * `encodeQueueCursor`/`decodeQueueCursor` in lib/admin/queues.ts, just keyed
 * on `createdAt` instead of `updatedAt` (this table has no `updatedAt`; it is
 * append-only). Added for the Phase 2 activity-timeline route
 * (app/api/admin/users/[id]/activity/route.ts) — `listEventsForUser`'s own
 * cursor SHAPE is unchanged, this only gives a route handler a way to
 * serialize/deserialize it across the wire.
 */
export function encodeEventCursor(cursor: EventCursor): string {
  return Buffer.from(JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }), "utf8").toString(
    "base64url"
  );
}

export function decodeEventCursor(raw: string): EventCursor | null {
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
 * Cursor-paginated on (createdAt, id) — never OFFSET, per §7 of the plan.
 * `cursor` is the `nextCursor` of the previous page (the last row's
 * createdAt/id), not a row offset.
 *
 * `eventType` (docs/ADMIN-CONSOLE-PLAN.md §4.3: the activity timeline is
 * "filterable by type") is optional and additive — every existing caller
 * (there are none yet outside this module, but the shape is deliberately
 * unchanged) that omits it keeps seeing every event type for the user,
 * exactly as before.
 */
export async function listEventsForUser(
  userId: string,
  {
    cursor,
    limit = DEFAULT_EVENT_LIST_LIMIT,
    eventType,
  }: { cursor?: EventCursor; limit?: number; eventType?: PlatformEventType } = {}
) {
  const boundedLimit = Math.min(Math.max(limit, 1), MAX_EVENT_LIST_LIMIT);

  const events = await prisma.platformEvent.findMany({
    where: {
      userId,
      ...(eventType ? { eventType } : {}),
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

  const hasMore = events.length > boundedLimit;
  const page = hasMore ? events.slice(0, boundedLimit) : events;
  const last = page[page.length - 1];

  return {
    events: page,
    nextCursor: hasMore && last ? { createdAt: last.createdAt, id: last.id } : null,
  };
}
