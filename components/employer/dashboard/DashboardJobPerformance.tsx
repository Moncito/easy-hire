import Link from "next/link";
import type { JobPerformanceRow } from "@/lib/employer/dashboard-panels";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";

type Props = {
  rows: JobPerformanceRow[];
  variant?: "free" | "pro";
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  return pipe === -1 ? title : title.slice(0, pipe);
}

export default function DashboardJobPerformance({ rows, variant = "free" }: Props) {
  const topApplicants = Math.max(...rows.map((row) => row.applicants), 0);

  const table = (
    <>
      <div className="mb-4">
        <p
          className={`text-xs font-bold uppercase tracking-wider ${
            variant === "pro" ? "text-ink/45" : "text-navy/60"
          }`}
        >
          Listing analytics
        </p>
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">Job performance</h2>
        <p className="mt-1 text-xs text-ink/45">
          Compare views and applicant conversion across active roles.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/[0.06] text-xs font-bold uppercase tracking-wider text-ink/40">
              <th className="pb-2 pr-4 font-bold">Job</th>
              <th className="pb-2 pr-4 text-right font-bold">Views</th>
              <th className="pb-2 pr-4 text-right font-bold">Applicants</th>
              <th className="pb-2 text-right font-bold">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const barWidth =
                topApplicants > 0 ? Math.max((row.applicants / topApplicants) * 100, row.applicants > 0 ? 12 : 0) : 0;

              return (
                <tr key={row.id} className="border-b border-ink/[0.04] last:border-0">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/employer/jobs/${row.id}/applicants`}
                      className="group block max-w-[220px]"
                      title={row.title}
                    >
                      <span className={`line-clamp-1 font-semibold text-ink transition ${
                        variant === "pro" ? "group-hover:text-[#9A5B12]" : "group-hover:text-teal"
                      }`}>
                        {splitTitle(row.title)}
                      </span>
                      <span className="mt-1 block h-1 max-w-[120px] overflow-hidden rounded-full bg-ink/5">
                        <span
                          className={`block h-full rounded-full transition-all ${
                            variant === "pro" ? "bg-marigold" : "bg-teal/70"
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right font-data font-bold text-ink">{row.views}</td>
                  <td className="py-3 pr-4 text-right font-data font-bold text-ink">{row.applicants}</td>
                  <td className="py-3 text-right">
                    {row.conversion === null ? (
                      <span className="text-xs text-ink/30">—</span>
                    ) : (
                      <span
                        className={`font-data text-sm font-bold ${
                          variant === "pro"
                            ? "text-ink"
                            : row.conversion >= 20
                              ? "text-teal"
                              : "text-ink/70"
                        }`}
                      >
                        {row.conversion}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  if (variant === "pro") {
    return <div className="pro-card p-5 sm:p-6">{table}</div>;
  }

  return <DashboardSurface>{table}</DashboardSurface>;
}
