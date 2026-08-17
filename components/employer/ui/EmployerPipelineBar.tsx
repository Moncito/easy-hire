type Props = {
  applied: number;
  shortlisted: number;
  interview: number;
  hired: number;
  variant?: "free" | "pro";
};

export default function EmployerPipelineBar({
  applied,
  shortlisted,
  interview,
  hired,
  variant = "free",
}: Props) {
  const total = applied + shortlisted + interview + hired;
  const isPro = variant === "pro";

  if (total === 0) {
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
        <div className="h-full w-0 rounded-full bg-ink/15" />
      </div>
    );
  }

  const segments = isPro
    ? [
        { count: applied, className: "bg-ink", label: "Applied" },
        { count: shortlisted, className: "bg-marigold", label: "Shortlisted" },
        { count: interview, className: "bg-navy", label: "Interview" },
        { count: hired, className: "bg-teal", label: "Hired" },
      ]
    : [
        { count: applied, className: "bg-ink/25", label: "Applied" },
        { count: shortlisted, className: "bg-teal/60", label: "Shortlisted" },
        { count: interview, className: "bg-navy/50", label: "Interview" },
        { count: hired, className: "bg-teal", label: "Hired" },
      ];

  return (
    <div
      className="flex h-1.5 w-full overflow-hidden rounded-full bg-ink/8"
      role="img"
      aria-label={`Pipeline: ${applied} applied, ${shortlisted} shortlisted, ${interview} interview, ${hired} hired`}
      title={`${applied} applied · ${shortlisted} shortlisted · ${interview} interview · ${hired} hired`}
    >
      {segments
        .filter((seg) => seg.count > 0)
        .map((seg) => (
          <div
            key={seg.label}
            className={`employer-pipeline-segment h-full ${seg.className}`}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
    </div>
  );
}
