import { requireAdminPagePermission } from "@/lib/auth/admin-session";
import { listJobDirectory, getJobDirectoryStats, getJobPostingTrend } from "@/lib/admin/jobs";
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
  // `queue.decide` — matches the permission on GET /api/admin/jobs/directory,
  // so the server-rendered first paint can't serve what the API refuses (§8.1).
  await requireAdminPagePermission("queue.decide");
  const { search } = await searchParams;

  // Three independent reads — the table page, the unfiltered stat tiles, and
  // the posting trend chart — none of which depends on another, so they run
  // in parallel rather than sequentially. Same pattern as app/admin/users/page.tsx.
  const [{ items, nextCursor }, stats, postingTrend] = await Promise.all([
    listJobDirectory({ search: search || undefined, limit: 25 }),
    getJobDirectoryStats(),
    getJobPostingTrend(),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">Directory / Jobs</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink admin-dark:text-mist">Jobs</h1>
        <p className="mt-2 text-sm text-ink/55 admin-dark:text-mist/55">
          Every job posting, any status — draft, pending review, active or closed. For the risk-ranked approval
          queue, see Queues → Jobs.
        </p>
      </div>

      <JobDirectory
        initialItems={JSON.parse(JSON.stringify(items))}
        initialNextCursor={nextCursor ? encodeQueueCursor(nextCursor) : null}
        initialSearch={search ?? ""}
        stats={JSON.parse(JSON.stringify(stats))}
        postingTrend={JSON.parse(JSON.stringify(postingTrend))}
      />
    </div>
  );
}
