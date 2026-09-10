import { requireAdminPageContext } from "@/lib/auth/admin-session";
import { listUserDirectory, encodeUserDirectoryCursor, DEFAULT_USER_DIRECTORY_LIMIT } from "@/lib/admin/users";
import UserDirectory from "@/components/admin/directory/UserDirectory";

/**
 * `/admin/users` — the admin directory (docs/ADMIN-CONSOLE-PLAN.md §4.3/§3,
 * Phase 2): every user, any role, searchable, cursor-paginated. Server
 * component renders the first page by calling `listUserDirectory` directly
 * (§5: "Server components for reads"); `UserDirectory` (client) handles all
 * later filtering/searching/paging against `GET /api/admin/users`. Same
 * `JSON.parse(JSON.stringify(...))` serialization boundary every other
 * admin page in this codebase already uses (see app/admin/queues/[kind]/page.tsx).
 */
export default async function AdminUsersPage() {
  await requireAdminPageContext();

  const { items, nextCursor } = await listUserDirectory({ limit: DEFAULT_USER_DIRECTORY_LIMIT });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Directory / Users</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Users</h1>
        <p className="mt-2 text-sm text-ink/55">
          Every account on the platform, any role. Open a row for the full 360-degree record.
        </p>
      </div>

      <UserDirectory
        initialItems={JSON.parse(JSON.stringify(items))}
        initialNextCursor={nextCursor ? encodeUserDirectoryCursor(nextCursor) : null}
      />
    </div>
  );
}
