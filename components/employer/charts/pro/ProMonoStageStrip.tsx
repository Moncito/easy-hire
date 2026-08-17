type Funnel = {
  applied: number;
  reviewed: number;
  interview: number;
  hired: number;
};

const STAGES: Array<{ key: keyof Funnel; label: string; fill: string; opacity: number }> = [
  { key: "applied", label: "Applied", fill: "var(--pro-chart-ink, #20242B)", opacity: 1 },
  { key: "reviewed", label: "Reviewed", fill: "var(--pro-chart-ink, #20242B)", opacity: 0.62 },
  { key: "interview", label: "Interview", fill: "var(--pro-chart-ink, #20242B)", opacity: 0.32 },
  { key: "hired", label: "Hired", fill: "#F2A93B", opacity: 1 },
];

type Props = {
  funnel: Funnel;
};

/** Compact stacked pipeline — same ink scale + marigold hired as the large funnel. */
export default function ProMonoStageStrip({ funnel }: Props) {
  const total = STAGES.reduce((sum, stage) => sum + funnel[stage.key], 0);
  const aria = STAGES.map((stage) => `${stage.label} ${funnel[stage.key]}`).join(", ");

  if (total === 0) {
    return (
      <div className="h-2 w-full rounded-full bg-ink/[0.08]" aria-label="No pipeline activity yet" />
    );
  }

  return (
    <div
      className="flex h-2 w-full overflow-hidden rounded-full"
      role="img"
      aria-label={`Pipeline mix: ${aria}`}
    >
      {STAGES.map((stage) => {
        const value = funnel[stage.key];
        if (value <= 0) return null;
        return (
          <span
            key={stage.key}
            className="h-full min-w-[4px]"
            style={{
              width: `${(value / total) * 100}%`,
              backgroundColor: stage.fill,
              opacity: stage.opacity,
            }}
          />
        );
      })}
    </div>
  );
}
