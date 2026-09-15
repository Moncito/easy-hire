/**
 * Client-side (serialized) mirrors for the admin team screen
 * (docs/ADMIN-CONSOLE-PLAN.md §6.7 admin roles, §8.1 access control, §3
 * `/admin/system/team`). Same convention as components/admin/directory/types.ts:
 * type-only imports from `/lib` are fine here (erased at compile time, and
 * this module carries no "use client" directive of its own) — the boundary
 * that must stay `/lib`-free is `AdminSidebar.tsx` specifically, which takes
 * plain primitives as props instead (see that file's comment).
 *
 * `AdminProfile.permissions` is a plain `string[]` in the DB and
 * `ResolvedAdminAccess.permissions` is a `ReadonlySet<AdminPermission>` on the
 * server — neither serializes across a Server->Client Component prop
 * boundary as-is (a `Set` turns into `{}` over RSC serialization, and JSON
 * over the wire has no `Set` type at all). Every array below is a plain,
 * already-deduplicated `AdminPermission[]`, computed once in
 * `app/admin/system/team/page.tsx` from the real `resolveAdminAccess` /
 * `defaultPermissionsForLevel` exports — this module never recomputes that
 * logic client-side, only re-types the wire shape for the browser.
 */
import type { AdminLevel } from "@prisma/client";
import type { AdminPermission } from "@/lib/admin/permissions";

export type { AdminLevel, AdminPermission };

export const ADMIN_LEVELS: readonly AdminLevel[] = ["SUPPORT", "MODERATOR", "FINANCE", "SUPER_ADMIN"];

export type SerializedAdminTeamRow = {
  userId: string;
  email: string;
  /** False for a `Role.ADMIN` user with no `AdminProfile` row — computed server-side from `AdminTeamMember.createdAt` being the epoch sentinel `listAdminTeam` uses for "no row" (see lib/admin/permissions.ts). These are the admins who silently drop to SUPPORT the moment bootstrap ends. */
  hasProfile: boolean;
  /** Raw `AdminProfile.level` — `LOWEST_ADMIN_LEVEL` ("SUPPORT") when `hasProfile` is false, matching `AdminTeamMember.level`'s own fallback. This is what a PATCH with no `level` field would leave unchanged, and what the last-SUPER_ADMIN guard checks against. */
  level: AdminLevel;
  /** Raw `AdminProfile.permissions` (additive grants only, filtered to the known vocabulary) — `[]` when `hasProfile` is false. */
  rawPermissions: AdminPermission[];
  /** What this admin's access actually resolves to right now, via `resolveAdminAccess` — differs from `level` only during bootstrap, where every admin (profiled or not) resolves to SUPER_ADMIN. */
  resolvedLevel: AdminLevel;
  /** Level defaults plus additive grants, with the SUPER_ADMIN-only floor already applied and bootstrap already accounted for — "what this admin can actually do right now." */
  effectivePermissions: AdminPermission[];
  /** `defaultPermissionsForLevel(resolvedLevel)` — the permissions that come from the level itself. */
  levelDefaultPermissions: AdminPermission[];
  /** `effectivePermissions` minus `levelDefaultPermissions` — permissions this admin holds only because they were granted individually. */
  grantedBeyondLevel: AdminPermission[];
  /** Raw grants present in `rawPermissions` but NOT reflected in `effectivePermissions` — e.g. a SUPER_ADMIN-only permission stored on a non-SUPER_ADMIN row. Shown so a grant with no effect is never mistaken for one that works. */
  ineffectiveGrants: AdminPermission[];
  /** True when this row is the signed-in viewer. Self-escalation is refused server-side regardless — every level, `SUPER_ADMIN` included — so the level/permission controls on this row are disabled in the UI too, with the reason stated inline. */
  isSelf: boolean;
  /** True when this row is the only remaining SUPER_ADMIN profile. Demoting or revoking it returns 409 server-side; the UI disables those two controls and says why instead of surfacing the 409 as a toast. */
  isLastSuperAdmin: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};
