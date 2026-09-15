import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminUserDirectoryQuerySchema } from "@/lib/validations/admin";
import { listUserDirectory, decodeUserDirectoryCursor, encodeUserDirectoryCursor } from "@/lib/admin/users";

/**
 * GET /api/admin/users?role=&verified=&search=&cursor=&limit= — the admin
 * user directory (docs/ADMIN-CONSOLE-PLAN.md §4.3/§3, Phase 2): all users,
 * any role, searchable by email/name, filterable by role and verified state,
 * cursor-paginated. Thin handler: auth, Zod-validate, call
 * lib/admin/users.ts, respond — same shape as GET /api/admin/queues.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "user.read");

    const url = new URL(req.url);
    const query = adminUserDirectoryQuerySchema.parse({
      role: url.searchParams.get("role") ?? undefined,
      verified: url.searchParams.get("verified") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    let cursor;
    if (query.cursor) {
      cursor = decodeUserDirectoryCursor(query.cursor);
      if (!cursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
    }

    const { items, nextCursor } = await listUserDirectory({
      role: query.role,
      verified: query.verified,
      search: query.search,
      cursor: cursor ?? undefined,
      limit: query.limit,
    });

    return NextResponse.json({
      items,
      nextCursor: nextCursor ? encodeUserDirectoryCursor(nextCursor) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
