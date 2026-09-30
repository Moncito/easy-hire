import { Fragment } from "react";
import type { PipelineFunnel } from "@/lib/employer/dashboard-pipeline";
import { stageConversion } from "@/lib/employer/dashboard-pipeline";

/**
 * Applied → Reviewed → Interviewed → Hired over active roles. Each stage
 * counts applications that reached it or went further (buildPipelineFunnel),
 * so the bars only get shorter. Bars are sized against Applied.
 */
export default function ProPipelineFunnel({ funnel }: { funnel: PipelineFunnel }) {
  const stages = [
    { name: "Applied", value: funnel.applied, drop: null },
    { name: "Reviewed", value: funnel.reviewed, drop: "reviewed" },
    { name: "Interviewed", value: funnel.interviewed, drop: "interviewed" },
    { name: "Hired", value: funnel.hired, drop: "hired" },
  ];
  const base = Math.max(1, funnel.applied);

  return (
    <section
      aria-labelledby="pro-pipeline-heading"
      className="rounded-card border border-eh-line bg-eh-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <div className="flex items-center gap-2.5 px-5 pt-4">
        <h2 id="pro-pipeline-heading" className="text-card-title text-eh-ink">
          Pipeline
        </h2>
        <span className="text-ui text-eh-muted">All active roles</span>
      </div>

      <div className="flex flex-col gap-3.5 px-5 pb-5 pt-4">
        {stages.map((stage, i) => {
          const conversion = i > 0 ? stageConversion(stages[i - 1].value, stage.value) : null;
          const last = i === stages.length - 1;
          return (
            <Fragment key={stage.name}>
              {i > 0 && (
                <p className="num -my-2 pl-[102px] text-xs text-eh-muted">
                  {conversion === null ? "—" : `${conversion}% ${stage.drop}`}
                </p>
              )}
              <div className="grid grid-cols-[92px_1fr_36px] items-center gap-2.5">
                <span className="text-ui text-eh-ink-2">{stage.name}</span>
                <div className="h-[26px] overflow-hidden rounded-[6px] border border-eh-line bg-eh-surface-2">
                  <div
                    className={`h-full rounded-[5px] motion-safe:transition-[width] motion-safe:duration-500 ${
                      last ? "bg-eh-marigold" : "bg-eh-ink"
                    }`}
                    style={{ width: `${Math.round((stage.value / base) * 100)}%` }}
                  />
                </div>
                <span className="num text-right font-semibold text-eh-ink">{stage.value}</span>
              </div>
            </Fragment>
          );
        })}

        <p className="mt-1 border-t border-dashed border-eh-line pt-3 text-xs text-eh-muted">
          Each stage counts applications that reached it, so the numbers only go down.
          {funnel.rejectedWithoutHistory > 0 &&
            ` ${funnel.rejectedWithoutHistory} rejected ${
              funnel.rejectedWithoutHistory === 1 ? "application predates" : "applications predate"
            } stage tracking, so ${funnel.rejectedWithoutHistory === 1 ? "it counts" : "they count"} only as reviewed.`}
        </p>
      </div>
    </section>
  );
}
