import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";

/**
 * Stage counts as a readable list with proportional bars. The previous single
 * stacked bar needed a legend to decode and its caption ("One bar. Four
 * stages.") was a note to ourselves. "Reviewed" counts every application
 * someone has acted on (shortlisted, interviewed, hired, or rejected), so
 * the stages overlap rather than sum.
 *
 * Heading sits above the card, like every other dashboard section, so
 * neighbouring cards line up.
 */
export default function ProPipelineStages({ funnel }: { funnel: EmployerAnalytics["funnel"] }) {
  const stages = [
    { label: "Waiting for review", value: funnel.applied, bar: "bg-ink/70" },
    { label: "Reviewed", value: funnel.reviewed, bar: "bg-ink/40" },
    { label: "In interview", value: funnel.interview, bar: "bg-teal" },
    { label: "Hired", value: funnel.hired, bar: "bg-marigold" },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <section aria-labelledby="pro-pipeline-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="pro-pipeline-heading" className="text-base font-semibold text-ink">
            Pipeline
          </h2>
          <p className="mt-0.5 text-sm text-ink/45">Across all roles.</p>
        </div>
        <Link
          href="/employer/applicants"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink/55 transition hover:text-ink"
        >
          Applicants
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="pro-card p-5">
        <ul className="space-y-3.5">
          {stages.map((stage) => (
            <li key={stage.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink/65">{stage.label}</span>
                <span className="font-data font-bold tabular-nums text-ink">{stage.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden="true">
                <div
                  className={`h-full rounded-full ${stage.bar}`}
                  style={{ width: `${Math.round((stage.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink/40">Stages overlap: a hire was also reviewed.</p>
      </div>
    </section>
  );
}
