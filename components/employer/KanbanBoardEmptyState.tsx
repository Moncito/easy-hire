import Link from "next/link";
import { Users } from "lucide-react";

type Props = {
  jobId: string;
  jobStatus: string;
};

export default function KanbanBoardEmptyState({ jobId, jobStatus }: Props) {
  const isLive = jobStatus === "ACTIVE";

  return (
    <div className="mb-6 rounded-2xl border border-ink/8 bg-white p-8 text-center shadow-xs sm:p-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
        <Users className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="font-display text-lg font-bold text-ink">No applicants yet</h2>
      {isLive ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
          Your job is live. When virtual assistants apply, they will appear in the pipeline
          columns below — organized by hiring stage.
        </p>
      ) : (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
          Applicants appear here after your job is approved and goes live on the public job board.
          {jobStatus === "DRAFT" && " Submit it for review when you're ready."}
          {jobStatus === "PENDING_REVIEW" && " It is currently awaiting admin review."}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/employer/jobs/${jobId}/edit`}
          className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-colors hover:bg-teal/95"
        >
          {jobStatus === "DRAFT" ? "Finish & submit job" : "View job posting"}
        </Link>
        <Link
          href="/employer/jobs"
          className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/3"
        >
          All job postings
        </Link>
      </div>
    </div>
  );
}
