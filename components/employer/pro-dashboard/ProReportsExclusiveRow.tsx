import type { ReactNode } from "react";
import Link from "next/link";
import { formatDaysToHire } from "@/lib/employer/reports-helpers";
import type { ReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";
import ProMonoMiniBars from "@/components/employer/charts/pro/ProMonoMiniBars";
import ProMonoMeter from "@/components/employer/charts/pro/ProMonoMeter";
import ProMonoStageStrip from "@/components/employer/charts/pro/ProMonoStageStrip";

type Funnel = {
  applied: number;
  reviewed: number;
  interview: number;
  hired: number;
};

type Props = {
  exclusive: ReportsExclusiveMetrics;
  funnel: Funnel;
  totalApplicants: number;
  weekApplications: number[];
  jobConversions: number[];
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  return pipe === -1 ? title : title.slice(0, pipe);
}

function MetricCard({
  label,
  value,
  hint,
  chart,
  footer,
}: {
  label: string;
  value: string;
  hint: string;
  chart: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className="pro-card flex flex-col overflow-hidden p-0">
      <div className="flex flex-1 flex-col px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{label}</p>
        <p className="mt-2 font-data text-3xl font-bold tabular-nums tracking-tight text-ink sm:text-4xl">
          {value}
        </p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/50">{hint}</p>
        {footer}
      </div>
      <div className="mt-auto flex min-h-[3.25rem] items-center border-t border-ink/[0.04] bg-mist/50 px-5 py-3 sm:px-6">
        <div className="w-full">{chart}</div>
      </div>
    </article>
  );
}

export default function ProReportsExclusiveRow({
  exclusive,
  funnel,
  totalApplicants,
  weekApplications,
  jobConversions,
}: Props) {
  const days = formatDaysToHire(exclusive.daysToHire);
  const best = exclusive.bestJob;
  const hirePct =
    totalApplicants > 0 ? Math.min(100, Math.round((funnel.hired / totalApplicants) * 100)) : 0;

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Best performing job"
        value={best ? (best.conversion == null ? "—" : `${best.conversion}%`) : "—"}
        hint={
          best
            ? `${splitTitle(best.title)} · ${best.applicants} applicant${best.applicants === 1 ? "" : "s"} · ${best.views} views`
            : "Post a job to compare conversion."
        }
        footer={
          <Link
            href={best ? `/employer/jobs/${best.id}/applicants` : "/employer/jobs/new"}
            className="mt-3 text-sm font-semibold text-[#9A5B12] hover:underline"
          >
            {best ? "Open pipeline" : "Post a job"}
          </Link>
        }
        chart={
          jobConversions.length > 0 ? (
            <ProMonoMiniBars
              values={jobConversions}
              fill="ink"
              label="Conversion across active jobs"
            />
          ) : (
            <ProMonoMeter percent={0} fill="ink" label="Conversion" />
          )
        }
      />

      <MetricCard
        label="Avg. days to hire"
        value={days.value}
        hint={days.hint}
        chart={
          <ProMonoMiniBars values={weekApplications} fill="ink" label="Applications this week" />
        }
      />

      <MetricCard
        label="Review rate"
        value={exclusive.reviewRate.value}
        hint={exclusive.reviewRate.hint}
        chart={<ProMonoStageStrip funnel={funnel} />}
      />

      <MetricCard
        label="Hire rate"
        value={exclusive.hireRate.value}
        hint={exclusive.hireRate.hint}
        chart={
          <ProMonoMeter
            percent={hirePct}
            fill="marigold"
            label="Share of applicants hired"
          />
        }
      />
    </div>
  );
}
