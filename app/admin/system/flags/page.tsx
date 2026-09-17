import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { hasPermission } from "@/lib/admin/permissions";
import { listFeatureFlags } from "@/lib/admin/feature-flags";
import FeatureFlagsManager from "@/components/admin/flags/FeatureFlagsManager";
import type { SerializedFeatureFlag } from "@/components/admin/flags/types";

/**
 * `/admin/system/flags` (docs/ADMIN-CONSOLE-PLAN.md §4.10, `feature_flags`
 * table added in the Sprint 11 registry). Server component renders the first
 * paint via `listFeatureFlags` directly, gated on `system.read` — same
 * pattern as `app/admin/system/team/page.tsx` and `/admin/system`.
 *
 * Reads need only `system.read`; writes need `system.manage`
 * (lib/admin/feature-flags.ts's own doc comment). `canManage` is resolved
 * HERE, once, via the real `hasPermission` export, and handed to
 * `FeatureFlagsManager` as a plain boolean prop — the client shell never
 * re-derives it.
 */
export default async function FeatureFlagsPage() {
  const ctx = await requireAdminPagePermission("system.read");
  const canManage = hasPermission(ctx.access, "system.manage");

  const flags = await listFeatureFlags(ctx.userId);
  const rows = JSON.parse(JSON.stringify(flags)) as SerializedFeatureFlag[];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">System / Feature flags</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Feature flags</h1>
        <p className="mt-2 text-sm text-ink/55">
          Every flag `isFeatureEnabled` can read. A flag is off unless <span className="font-data">enabled</span> is
          true; when it&rsquo;s on, an unset rollout percentage means everyone gets it, and a set percentage buckets
          each user deterministically — never a per-request coin flip.
        </p>
      </div>

      <FeatureFlagsManager rows={rows} canManage={canManage} />
    </div>
  );
}
