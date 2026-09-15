import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import {
  listAdminTeam,
  defaultPermissionsForLevel,
  resolveAdminAccess,
  isAdminPermission,
  type AdminTeamMember,
  type AdminPermission,
} from "@/lib/admin/permissions";
import AdminTeamManager from "@/components/admin/team/AdminTeamManager";
import type { SerializedAdminTeamRow } from "@/components/admin/team/types";

/**
 * `/admin/system/team` (docs/ADMIN-CONSOLE-PLAN.md §3, §6.7, §8.1) — admin
 * roles and permissions. Server component renders the first paint via
 * `listAdminTeam` directly (§5: "Server components for reads"), same pattern
 * as `app/admin/users/page.tsx`; `AdminTeamManager` (client) handles every
 * mutation against `/api/admin/team[/​[id]]`.
 *
 * Every derived field a row needs (effective permissions, which come from
 * the level vs. which were granted individually, whether this is the last
 * SUPER_ADMIN) is computed HERE, once, using the real exports from
 * `lib/admin/permissions.ts` — never re-implemented client-side. In
 * particular `resolveAdminAccess` (pure, no DB call) is called per row with
 * `totalAdminProfileCount` collapsed to `isBootstrap ? 0 : 1`: the function
 * only branches on whether that count is zero, so the exact count is never
 * needed here, only the boolean `listAdminTeam` already returns. That gives
 * an ACCURATE effective-permission set per row — including the SUPER_ADMIN-only
 * floor and the bootstrap-wide "every admin is implicitly SUPER_ADMIN" rule —
 * rather than a naive union of level defaults and raw stored grants.
 */

// `listAdminTeam` (lib/admin/permissions.ts) falls back to `new Date(0)` for
// `createdAt`/`updatedAt` on a `Role.ADMIN` user with no `AdminProfile` row —
// a fixed epoch constant, not the current time, so comparing against it here
// is not a clock read. `member.createdAt.getTime()` is always exactly `0`
// for a profile-less admin and never `0` for a real row (every real
// `AdminProfile.createdAt` is set by Prisma's `@default(now())` at creation).
const NO_PROFILE_SENTINEL_MS = 0;

function buildRows(members: AdminTeamMember[], isBootstrap: boolean, viewerUserId: string): SerializedAdminTeamRow[] {
  const superAdminProfileCount = members.filter(
    (m) => m.createdAt.getTime() !== NO_PROFILE_SENTINEL_MS && m.level === "SUPER_ADMIN"
  ).length;

  return members.map((member) => {
    const hasProfile = member.createdAt.getTime() !== NO_PROFILE_SENTINEL_MS;
    const rawPermissions: AdminPermission[] = hasProfile ? member.permissions.filter(isAdminPermission) : [];

    const resolved = resolveAdminAccess({
      userId: member.userId,
      profile: hasProfile ? { level: member.level, permissions: rawPermissions } : null,
      totalAdminProfileCount: isBootstrap ? 0 : 1,
    });

    const levelDefaultPermissions = [...defaultPermissionsForLevel(resolved.level)];
    const effectivePermissions = Array.from(resolved.permissions).sort();
    const grantedBeyondLevel = effectivePermissions.filter((p) => !levelDefaultPermissions.includes(p));
    const ineffectiveGrants = rawPermissions.filter((p) => !effectivePermissions.includes(p));

    return {
      userId: member.userId,
      email: member.email,
      hasProfile,
      level: member.level,
      rawPermissions,
      resolvedLevel: resolved.level,
      effectivePermissions,
      levelDefaultPermissions,
      grantedBeyondLevel,
      ineffectiveGrants,
      isSelf: member.userId === viewerUserId,
      isLastSuperAdmin: hasProfile && member.level === "SUPER_ADMIN" && superAdminProfileCount === 1,
      createdAt: hasProfile ? member.createdAt.toISOString() : null,
      updatedAt: hasProfile ? member.updatedAt.toISOString() : null,
    };
  });
}

export default async function AdminTeamPage() {
  // `team.manage` — SUPER_ADMIN only. Matches GET /api/admin/team and every
  // mutation on it; the page must assert this itself rather than rely on the
  // sidebar hiding its own link (§8.1: a missing route/page guard is not
  // supposed to be the only thing standing between an admin and this data).
  const ctx = await requireAdminPagePermission("team.manage");

  const { members, isBootstrap } = await listAdminTeam(ctx.userId);
  const rows = buildRows(members, isBootstrap, ctx.userId);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">System / Admin team</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Admin team</h1>
        <p className="mt-2 text-sm text-ink/55">
          Every Role.ADMIN account, its level, and the permissions it actually holds right now — level defaults plus
          anything granted individually.
        </p>
      </div>

      <AdminTeamManager rows={JSON.parse(JSON.stringify(rows))} isBootstrap={isBootstrap} viewerUserId={ctx.userId} />
    </div>
  );
}
