import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import {
  listUserDirectory,
  getUserDirectoryStats,
  getUserSignupTrend,
  encodeUserDirectoryCursor,
  DEFAULT_USER_DIRECTORY_LIMIT,
} from "@/lib/admin/users";
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
  // `user.read` — matches GET /api/admin/users. Every level except a
  // profile-less post-bootstrap admin holds it, but the page must assert it
  // rather than inherit a bare admin check (§8.1).
  await requireAdminPagePermission("user.read");

  // Three independent reads — the table page, the unfiltered stat tiles, and
  // the signup trend chart — none of which depends on another, so they run
  // in parallel rather than sequentially.
  const [{ items, nextCursor }, stats, signupTrend] = await Promise.all([
    listUserDirectory({ limit: DEFAULT_USER_DIRECTORY_LIMIT }),
    getUserDirectoryStats(),
    getUserSignupTrend(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Directory / Users</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">Users</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">
          Every account on the platform, any role. Open a row for the full 360-degree record.
        </p>
      </div>

      <UserDirectory
        initialItems={JSON.parse(JSON.stringify(items))}
        initialNextCursor={nextCursor ? encodeUserDirectoryCursor(nextCursor) : null}
        stats={JSON.parse(JSON.stringify(stats))}
        signupTrend={JSON.parse(JSON.stringify(signupTrend))}
      />
    </div>
  );
}
