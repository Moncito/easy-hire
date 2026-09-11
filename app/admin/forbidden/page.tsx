import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { requireAdminPageContext } from "@/lib/auth/admin-session";

/**
 * The explicit "no permission" state (docs/ADMIN-CONSOLE-PLAN.md §5: "an
 * explicit 'no permission' state rather than a 404"). Reached by
 * `requireAdminPagePermission` when a signed-in admin lacks the permission a
 * page requires.
 *
 * Deliberately NOT a 404: pretending the screen does not exist would leave an
 * operator debugging a missing link instead of asking for access. It names
 * the missing permission and their current level, because "ask someone for
 * `queue.decide`" is actionable and "access denied" is not.
 *
 * Ember is correct here — this is a genuine block, not a decorative warning.
 */
export default async function AdminForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ permission?: string }>;
}) {
  const { access } = await requireAdminPageContext();
  const { permission } = await searchParams;

  return (
    <div className="mx-auto max-w-lg py-16">
      <div className="rounded-2xl border border-ember/20 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ember/10">
          <ShieldAlert className="h-6 w-6 text-ember" aria-hidden="true" />
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">Not available at your access level</h1>

        <p className="mt-3 text-sm text-ink/60">
          Your admin account doesn&apos;t have the permission this screen requires. Nothing is wrong with the page —
          it&apos;s scoped to a higher level than yours.
        </p>

        <dl className="mt-6 space-y-2 rounded-xl bg-mist/70 px-4 py-3 text-left text-xs">
          {permission && (
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-ink/45">Missing permission</dt>
              <dd className="font-data font-semibold text-ink">{permission}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="font-semibold text-ink/45">Your level</dt>
            <dd className="font-data font-semibold text-ink">{access.level}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-ink/45">
          A <span className="font-data font-semibold text-ink/60">SUPER_ADMIN</span> can grant this from the admin team
          settings.
        </p>

        <Link
          href="/admin/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
