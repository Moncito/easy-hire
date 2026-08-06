import Link from "next/link";
import { Users, ExternalLink, ArrowLeft } from "lucide-react";

type Props = {
  jobId: string;
  jobStatus: string;
  companyVerified: boolean;
};

export default function KanbanBoardEmptyState({ jobId, jobStatus, companyVerified }: Props) {
  const isLive = jobStatus === "ACTIVE" && companyVerified;
  const isDraft = jobStatus === "DRAFT";
  const isPending = jobStatus === "PENDING_REVIEW";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink/10 bg-ink/[0.015] px-6 py-14 text-center sm:py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/8 text-teal">
        <Users className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 className="font-display text-xl font-bold text-ink">No applicants yet</h2>
      {isLive ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
          Your job is live on the board. When virtual assistants apply, they&apos;ll show up here
          in a pipeline you can drag through Applied → Shortlisted → Interview → Hired.
        </p>
      ) : isDraft ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
          Finish your job posting and submit it for review. Applicants will appear here once the
          listing goes live.
        </p>
      ) : isPending ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
          Your job is awaiting admin review. Once approved and published, applications will land
          here automatically.
        </p>
      ) : (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/55">
          Applicants appear here when seekers apply to this role.
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {isLive ? (
          <Link
            href={`/jobs/${jobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-colors hover:bg-teal/95"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View public listing
          </Link>
        ) : (
          <Link
            href={`/employer/jobs/${jobId}/edit`}
            className="rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-colors hover:bg-teal/95"
          >
            {isDraft ? "Finish & submit job" : "View job posting"}
          </Link>
        )}
        <Link
          href="/employer/jobs"
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/3"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All job postings
        </Link>
      </div>
    </div>
  );
}
