import Link from "next/link";
import { formatDaysToHire } from "@/lib/employer/reports-helpers";
import type { ReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";

type Props = {
  exclusive: ReportsExclusiveMetrics;
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  return pipe === -1 ? title : title.slice(0, pipe);
}

export default function ProReportsExclusiveRow({ exclusive }: Props) {
  const days = formatDaysToHire(exclusive.daysToHire);
  const best = exclusive.bestJob;

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="pro-card flex flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Best performing job</p>
        {best ? (
          <>
            <p className="mt-2 font-data text-3xl font-bold tabular-nums text-ink">
              {best.conversion == null ? "—" : `${best.conversion}%`}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-ink/55">{splitTitle(best.title)}</p>
            <p className="mt-1 font-data text-xs text-ink/40">
              {best.applicants} applicant{best.applicants === 1 ? "" : "s"} · {best.views} views
            </p>
            <Link
              href={`/employer/jobs/${best.id}/applicants`}
              className="mt-auto pt-3 text-sm font-semibold text-[#9A5B12] hover:underline"
            >
              Open pipeline
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 font-data text-3xl font-bold text-ink">—</p>
            <p className="mt-1 text-sm text-ink/50">Post a job to compare conversion.</p>
            <Link
              href="/employer/jobs/new"
              className="mt-auto pt-3 text-sm font-semibold text-[#9A5B12] hover:underline"
            >
              Post a job
            </Link>
          </>
        )}
      </article>

      <article className="pro-card flex flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Avg. days to hire</p>
        <p className="mt-2 font-data text-3xl font-bold tabular-nums text-ink">{days.value}</p>
        <p className="mt-1 text-sm text-ink/50">{days.hint}</p>
      </article>

      <article className="pro-card flex flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Review rate</p>
        <p className="mt-2 font-data text-3xl font-bold tabular-nums text-ink">
          {exclusive.reviewRate.value}
        </p>
        <p className="mt-1 text-sm text-ink/50">{exclusive.reviewRate.hint}</p>
      </article>

      <article className="pro-card flex flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Hire rate</p>
        <p className="mt-2 font-data text-3xl font-bold tabular-nums text-ink">
          {exclusive.hireRate.value}
        </p>
        <p className="mt-1 text-sm text-ink/50">{exclusive.hireRate.hint}</p>
      </article>
    </div>
  );
}
