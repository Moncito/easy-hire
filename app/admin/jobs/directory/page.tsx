import { requireAdminPageContext } from "@/lib/auth/admin-session";
import { listJobDirectory } from "@/lib/admin/jobs";
import { encodeQueueCursor } from "@/lib/admin/queues";
import JobDirectory from "@/components/admin/directory/JobDirectory";

/**
 * `/admin/jobs/directory` — all jobs, any status (docs/ADMIN-CONSOLE-PLAN.md
 * §3, Phase 2). ROUTING NOTE (per the task brief): `/admin/jobs` currently
 * redirects to `/admin/queues/jobs` (Phase 1's risk-ranked moderation
 * queue). §3 eventually reassigns `/admin/jobs` itself to this all-status
 * directory, but that redirect is a separate decision this task does not
 * make — the directory lives at this `/admin/jobs/directory` segment
 * instead, and the sidebar's "Jobs" link under Directory points here.
 *
 * Reads the initial `search` query param so a link from the company detail
 * page ("View in job directory") or the command palette lands pre-filtered,
 * without needing client-side JS to run first.
 */
export default async function AdminJobsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireAdminPageContext();
  const { search } = await searchParams;

  const { items, nextCursor } = await listJobDirectory({ search: search || undefined, limit: 25 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Directory / Jobs</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Jobs</h1>
        <p className="mt-2 text-sm text-ink/55">
          Every job posting, any status — draft, pending review, active or closed. For the risk-ranked approval
          queue, see Queues → Jobs.
        </p>
      </div>

      <JobDirectory
        initialItems={JSON.parse(JSON.stringify(items))}
        initialNextCursor={nextCursor ? encodeQueueCursor(nextCursor) : null}
        initialSearch={search ?? ""}
      />
    </div>
  );
}
