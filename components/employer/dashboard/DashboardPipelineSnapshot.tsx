import Link from "next/link";
import { Users, CalendarDays } from "lucide-react";

type Props = {
  appsTodayChange: number | null;
  interviewsChange: number | null;
};

export default function DashboardPipelineSnapshot({
  appsTodayChange,
  interviewsChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Pipeline snapshot</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-ink/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-ink/45">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Apps today</span>
          </div>
          <p className="mt-1 font-data text-xl font-bold text-ink/30">—</p>
          {appsTodayChange !== null && (
            <p className="mt-0.5 text-[10px] text-ink/35">{appsTodayChange}% vs yesterday</p>
          )}
        </div>
        <div className="rounded-xl bg-ink/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-ink/45">
            <Users className="h-3.5 w-3.5" strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-wide">In interview</span>
          </div>
          <p className="mt-1 font-data text-xl font-bold text-ink/30">—</p>
          {interviewsChange !== null && (
            <p className="mt-0.5 text-[10px] text-ink/35">{interviewsChange}% vs last week</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink/45">
        No pipeline activity yet. Share your job posts or browse talent to get candidates moving.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/employer/jobs"
          className="inline-flex rounded-lg bg-teal/10 px-2.5 py-1 text-[11px] font-semibold text-teal transition hover:bg-teal/15"
        >
          View jobs →
        </Link>
        <Link
          href="/employer/talent"
          className="inline-flex rounded-lg bg-navy/5 px-2.5 py-1 text-[11px] font-semibold text-navy transition hover:bg-navy/10"
        >
          Browse talent →
        </Link>
      </div>
    </div>
  );
}
