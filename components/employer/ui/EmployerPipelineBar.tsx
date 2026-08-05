type Props = {
  applied: number;
  shortlisted: number;
  interview: number;
  hired: number;
};

export default function EmployerPipelineBar({ applied, shortlisted, interview, hired }: Props) {
  const total = applied + shortlisted + interview + hired;
  if (total === 0) {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
        <div className="h-full w-0 rounded-full bg-ink/15" />
      </div>
    );
  }

  const segments = [
    { count: applied, className: "bg-ink/25" },
    { count: shortlisted, className: "bg-teal/60" },
    { count: interview, className: "bg-navy/50" },
    { count: hired, className: "bg-teal" },
  ].filter((s) => s.count > 0);

  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-ink/8"
      role="img"
      aria-label={`Pipeline: ${applied} applied, ${shortlisted} shortlisted, ${interview} interview, ${hired} hired`}
    >
      {segments.map((seg, i) => (
        <div
          key={i}
          className={`employer-pipeline-segment h-full ${seg.className}`}
          style={{ width: `${(seg.count / total) * 100}%` }}
        />
      ))}
    </div>
  );
}
