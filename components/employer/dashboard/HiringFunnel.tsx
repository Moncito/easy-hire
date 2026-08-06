type Props = {
  funnel: { applied: number; reviewed: number; interview: number; hired: number };
};

const stages = [
  { key: "applied" as const, label: "Applied", color: "bg-navy" },
  { key: "reviewed" as const, label: "Reviewed", color: "bg-navy/70" },
  { key: "interview" as const, label: "Interview", color: "bg-teal/80" },
  { key: "hired" as const, label: "Hired", color: "bg-teal" },
];

export default function HiringFunnel({ funnel }: Props) {
  const max = Math.max(funnel.applied, funnel.reviewed, funnel.interview, funnel.hired, 1);

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const value = funnel[stage.key];
        const width = Math.max((value / max) * 100, value > 0 ? 12 : 0);
        return (
          <div key={stage.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ink/70">{stage.label}</span>
              <span className="font-data font-bold text-ink">{value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/5">
              <div
                className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
