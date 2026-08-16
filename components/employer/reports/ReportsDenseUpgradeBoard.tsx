import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import ReportsMetricStrip from "@/components/employer/reports/ReportsMetricStrip";

type Props = {
  analytics: EmployerAnalytics;
};

const PREVIEW_BARS = [38, 62, 28, 74, 52, 88, 44];

/**
 * Free employers with enough activity to leave the sparse view still don't
 * get the dense trend/job-performance board — only Employer Pro does. This
 * shows the same top-line metrics as the sparse board, plus a locked
 * preview of what Pro reports add, instead of the dense charts themselves.
 */
export default function ReportsDenseUpgradeBoard({ analytics }: Props) {
  return (
    <div className="space-y-4">
      <ReportsMetricStrip analytics={analytics} />

      <DashboardSurface className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none select-none opacity-40 blur-[2px]">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-navy/60">
            7-day hiring trend
          </p>
          <div className="flex h-32 items-end gap-2">
            {PREVIEW_BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-navy/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 px-6 text-center backdrop-blur-[1px]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy/10 text-navy">
            <Lock className="h-4.5 w-4.5" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-ink">
              Deeper trend charts are an Employer Pro feature
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink/55">
              Upgrade to see day-by-day hiring trends, per-job performance breakdowns, and Easy AI
              hiring insights narratives.
            </p>
          </div>
          <Link
            href="/employer/billing"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-teal/20 transition hover:bg-teal/95"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            View Employer Pro
          </Link>
        </div>
      </DashboardSurface>
    </div>
  );
}
