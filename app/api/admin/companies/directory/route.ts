import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminCompanyDirectoryQuerySchema } from "@/lib/validations/admin";
import { listCompanyDirectory, decodeCompanyDirectoryCursor, encodeCompanyDirectoryCursor } from "@/lib/admin/companies";

/**
 * GET /api/admin/companies/directory?search=&cursor=&limit= — searchable
 * company directory (docs/ADMIN-CONSOLE-PLAN.md §5's ⌘K jump-to). Separate
 * route from GET /api/admin/companies (the pending-verification queue still
 * backing `listPendingCompanies`) — same "directory vs. queue" split as
 * GET /api/admin/jobs/directory next to GET /api/admin/jobs. Thin handler:
 * auth, Zod-validate, call lib/admin/companies.ts, respond.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "user.read");

    const url = new URL(req.url);
    const query = adminCompanyDirectoryQuerySchema.parse({
      search: url.searchParams.get("search") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    let cursor;
    if (query.cursor) {
      cursor = decodeCompanyDirectoryCursor(query.cursor);
      if (!cursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
    }

    const { items, nextCursor } = await listCompanyDirectory(session.user.id, {
      search: query.search,
      cursor: cursor ?? undefined,
      limit: query.limit,
    });

    return NextResponse.json({
      items,
      nextCursor: nextCursor ? encodeCompanyDirectoryCursor(nextCursor) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
