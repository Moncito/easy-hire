import Link from "next/link";
import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { ArrowRight } from "lucide-react";
import { listCompaniesForCollaborativeHiring } from "@/lib/admin/companies";
import CollaborativeHiringAccess from "@/components/admin/CollaborativeHiringAccess";

/**
 * NOT a redirect, unlike the other three legacy queue paths.
 *
 * docs/ADMIN-CONSOLE-PLAN.md §3 says the old moderation paths redirect to
 * /admin/queues/*, and the verification queue that used to live here has
 * indeed moved to /admin/queues/companies. But this page also hosted
 * CollaborativeHiringAccess — a per-company feature-access toggle that is
 * NOT part of moderation and has no home in the queue shell. Redirecting
 * the whole route would have silently removed the only UI for it.
 *
 * So the queue half moved out and the access tool stayed, with a signpost
 * to where the queue went. §3 reassigns /admin/companies to the all-company
 * directory in Phase 2; this tool folds into that page when it is built,
 * which is the right time to reconsider where it belongs (arguably
 * /admin/system/flags, §3's SYSTEM group, in Phase 5).
 */
export default async function AdminCompaniesPage() {
  // `queue.decide` — the same permission gating this page's own mutation,
  // PATCH /api/admin/companies/[id] (`set_collaborative_hiring`). The toggle
  // would 403 for a SUPPORT or FINANCE admin anyway; matching the gate here
  // means they don't get a screen full of controls that refuse them.
  //
  // The 8-permission vocabulary has no entry for per-company feature access
  // specifically. Reusing `queue.decide` rather than inventing a ninth is
  // deliberate — revisit if this tool moves to /admin/system/flags (§3).
  await requireAdminPagePermission("queue.decide");

  const collaborativeCompanies = await listCompaniesForCollaborativeHiring();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Company access</h1>
        <p className="mt-2 text-sm text-ink/55">
          Grant or revoke collaborative hiring for individual companies.
        </p>
      </div>

      <Link
        href="/admin/queues/companies"
        className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-navy/15 bg-navy/5 px-4 py-3 text-sm transition-colors hover:bg-navy/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
      >
        <span className="text-ink/75">
          Looking for <span className="font-semibold text-ink">company verifications</span>? They moved to the
          risk-ranked review queue.
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-navy">
          Open queue
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>

      <CollaborativeHiringAccess initialCompanies={JSON.parse(JSON.stringify(collaborativeCompanies))} />
    </div>
  );
}
