import { redirect } from "next/navigation";

/**
 * Legacy path. The job approval queue now lives in the unified, risk-ranked
 * shell at /admin/queues/jobs (Phase 1, docs/ADMIN-CONSOLE-PLAN.md §3: "the
 * queue versions live under /admin/queues/* and the old paths redirect. No
 * dead links, no broken bookmarks").
 *
 * A temporary redirect, not a permanent one: a 308 gets cached by the
 * browser and would be awkward to walk back if this path is ever reused.
 * §3 does not reassign /admin/jobs to anything else until Phase 2, where it
 * becomes the all-status job directory — at which point this file is
 * replaced by that page rather than by a different redirect.
 *
 * No auth check here on purpose — the redirect target runs its own, and
 * duplicating it would just be a second place to get it wrong.
 */
export default function AdminJobsPage() {
  redirect("/admin/queues/jobs");
}
