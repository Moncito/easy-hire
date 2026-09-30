import { Fragment } from "react";
import { cx } from "@/components/employer/system/cx";

export type PipelineStageTone = "ink" | "teal" | "marigold" | "muted" | "navy" | "teal-soft" | "teal-strong";

export type PipelineStage = {
  label: string;
  value: number;
  tone?: PipelineStageTone;
};

const FILL: Record<PipelineStageTone, string> = {
  ink: "bg-eh-ink",
  teal: "bg-eh-teal",
  marigold: "bg-eh-marigold",
  muted: "bg-eh-muted",
  navy: "bg-eh-navy",
  // Earlier progress in the same hue as later progress, so the bar reads as one movement.
  "teal-soft": "bg-[color-mix(in_srgb,var(--eh-teal)_45%,var(--eh-surface))]",
  "teal-strong": "bg-eh-teal-ink",
};

/**
 * Stages as labelled bars sized against the first stage, for dashboard,
 * job detail and reports. With `showConversion`, the % between consecutive
 * stages sits between the rows ("86% reviewed").
 */
export function PipelineSummary({
  stages,
  showConversion = false,
  note,
  className,
}: {
  stages: PipelineStage[];
  showConversion?: boolean;
  note?: string;
  className?: string;
}) {
  const base = Math.max(1, stages[0]?.value ?? 0);
  return (
    <div className={cx("flex flex-col gap-3.5", className)}>
      {stages.map((stage, i) => {
        const prev = stages[i - 1];
        const conversion = prev && prev.value > 0 ? Math.round((stage.value / prev.value) * 100) : null;
        return (
          <Fragment key={stage.label}>
            {showConversion && i > 0 && (
              <p className="num -my-2 pl-[104px] text-xs text-eh-muted">
                {conversion === null ? "—" : `${conversion}% ${stage.label.toLowerCase()}`}
              </p>
            )}
            <div className="grid grid-cols-[92px_1fr_40px] items-center gap-3">
              <span className="text-ui text-eh-ink-2">{stage.label}</span>
              <div className="h-6 overflow-hidden rounded-chip border border-eh-line bg-eh-surface-2" aria-hidden="true">
                <div
                  className={cx("h-full rounded-[5px] motion-safe:transition-[width] motion-safe:duration-200", FILL[stage.tone ?? "ink"])}
                  style={{ width: `${Math.round((stage.value / base) * 100)}%` }}
                />
              </div>
              <span className="num text-right font-semibold text-eh-ink">{stage.value}</span>
            </div>
          </Fragment>
        );
      })}
      {note && <p className="mt-1 border-t border-dashed border-eh-line pt-3 text-xs text-eh-muted">{note}</p>}
    </div>
  );
}

/**
 * Compact current-stage distribution for a table row: one thin segmented
 * bar plus a screen-reader sentence. Segments are proportional to counts;
 * an empty pipeline shows an empty track.
 */
export function PipelineMini({
  stages,
  showSummary = false,
  emptyLabel = "No applicants",
  className,
}: {
  stages: PipelineStage[];
  /** Print the stage counts under the bar instead of only for screen readers. */
  showSummary?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const total = stages.reduce((sum, s) => sum + s.value, 0);
  const summary = stages.filter((s) => s.value > 0).map((s) => `${s.value} ${s.label.toLowerCase()}`).join(" · ");
  return (
    <div className={cx("min-w-[96px]", className)}>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-eh-line" aria-hidden="true" title={summary || emptyLabel}>
        {total > 0 &&
          stages.map((s) =>
            s.value > 0 ? (
              <span key={s.label} className={FILL[s.tone ?? "ink"]} style={{ width: `${(s.value / total) * 100}%` }} />
            ) : null
          )}
      </div>
      <span className={showSummary ? "mt-1.5 block text-small text-eh-muted" : "sr-only"}>{summary || emptyLabel}</span>
    </div>
  );
}
