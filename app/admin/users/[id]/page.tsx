import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminPageContext } from "@/lib/auth/admin-session";
import { hasPermission } from "@/lib/admin/permissions";
import { getUserRecord } from "@/lib/admin/users";
import { listEventsForUser, encodeEventCursor } from "@/lib/admin/events";
import { ApiError } from "@/lib/api-error";
import UserRecordView from "@/components/admin/directory/UserRecordView";

/**
 * `/admin/users/[id]` — the 360-degree record (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3, Phase 2 gate: "any support question answerable from one screen
 * without opening Prisma Studio"). Server component calls `getUserRecord`
 * and the first page of `listEventsForUser` directly (§5: "Server
 * components for reads") — `getUserRecord` itself records the
 * `USER_RECORD_VIEWED` PII-read audit row, so this page does not duplicate
 * that.
 *
 * `canImpersonate` (§8.2, Phase 5) is resolved HERE, once, via the real
 * `hasPermission(ctx.access, "impersonate")` export and handed to
 * `UserRecordView` → `SupportActions` as a plain boolean — same pattern as
 * `app/admin/system/flags/page.tsx`'s `canManage`. Every viewer of this page
 * (not just SUPER_ADMIN) can reach `/admin/users/[id]` at all via
 * `requireAdminPageContext` alone; this is the finer-grained gate for the
 * "View as this user" control specifically.
 */
export default async function AdminUserRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminPageContext();
  const { userId: adminUserId } = ctx;
  const canImpersonate = hasPermission(ctx.access, "impersonate");
  const { id } = await params;

  let record;
  try {
    record = await getUserRecord(adminUserId, id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const { events, nextCursor } = await listEventsForUser(id, { limit: 50 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink admin-dark:text-mist/50 admin-dark:hover:text-mist"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to directory
        </Link>
      </div>

      <UserRecordView
        record={JSON.parse(JSON.stringify(record))}
        initialEvents={JSON.parse(JSON.stringify(events))}
        initialEventsNextCursor={nextCursor ? encodeEventCursor(nextCursor) : null}
        canImpersonate={canImpersonate}
      />
    </div>
  );
}
