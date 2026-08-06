import Link from "next/link";
import { BarChart3 } from "lucide-react";

type Bar = { label: string; applications: number; interviews: number };

type Props = {
  data: Bar[];
};

export default function WeeklyTrendChart({ data }: Props) {
  const totalApps = data.reduce((s, d) => s + d.applications, 0);
  const totalInterviews = data.reduce((s, d) => s + d.interviews, 0);
  const isEmpty = totalApps === 0 && totalInterviews === 0;

  if (isEmpty) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-ink/10 bg-ink/[0.03] px-6 py-10 text-center">
        <BarChart3 className="mb-3 h-9 w-9 text-ink/25" strokeWidth={1.5} />
        <p className="text-sm font-semibold text-ink/60">No hiring activity this week</p>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink/45">
          Applications and interview moves will appear here once candidates start engaging with
          your jobs.
        </p>
        <Link
          href="/employer/jobs/new"
          className="mt-4 inline-flex items-center rounded-lg bg-teal/10 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal/15"
        >
          Post a job →
        </Link>
      </div>
    );
  }

  const max = Math.max(...data.flatMap((d) => [d.applications, d.interviews]), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-navy" />
          Applications
        </span>
        <span className="flex items-center gap-1.5 text-ink/60">
          <span className="h-2.5 w-2.5 rounded-sm bg-teal" />
          Interviews
        </span>
      </div>
      <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
        {data.map((day) => (
          <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 120 }}>
              <div
                className="w-[42%] rounded-t-md bg-navy transition-all duration-500"
                style={{
                  height: `${Math.max((day.applications / max) * 100, day.applications > 0 ? 8 : 0)}%`,
                }}
                title={`${day.applications} applications`}
              />
              <div
                className="w-[42%] rounded-t-md bg-teal transition-all duration-500"
                style={{
                  height: `${Math.max((day.interviews / max) * 100, day.interviews > 0 ? 8 : 0)}%`,
                }}
                title={`${day.interviews} interviews`}
              />
            </div>
            <span className="text-[10px] font-medium text-ink/40">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
