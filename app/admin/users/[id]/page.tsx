import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireAdminPageContext } from "@/lib/auth/admin-session";
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
 */
export default async function AdminUserRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId: adminUserId } = await requireAdminPageContext();
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to directory
        </Link>
      </div>

      <UserRecordView
        record={JSON.parse(JSON.stringify(record))}
        initialEvents={JSON.parse(JSON.stringify(events))}
        initialEventsNextCursor={nextCursor ? encodeEventCursor(nextCursor) : null}
      />
    </div>
  );
}
