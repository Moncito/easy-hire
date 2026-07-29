import Link from "next/link";
import { auth } from "@/Auth";
import { Bookmark } from "lucide-react";
import { listSavedJobs } from "@/lib/saved-jobs";
import JobListingCard from "@/components/jobs/JobListingCard";

export default async function SavedJobsPage() {
  const session = await auth();
  const saved = session?.user ? await listSavedJobs(session.user.id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Saved jobs</h1>
        <p className="mt-2 text-sm text-ink/55">Your shortlist — come back anytime to apply.</p>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-navy/8 bg-white p-14 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-ink/25" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-bold text-ink">No saved jobs yet</h2>
          <p className="mt-2 text-sm text-ink/50">
            Tap the bookmark icon on any listing to save it here for later.
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90"
          >
            Browse jobs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {saved.map((s) => (
            <JobListingCard key={s.job.id} job={s.job} saved />
          ))}
        </div>
      )}
    </div>
  );
}
