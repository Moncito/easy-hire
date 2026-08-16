type Props = {
  score: number;
  percentile: number | null;
  hint?: string | null;
  compact?: boolean;
};

export default function HiringScoreGauge({ score, percentile, hint, compact = false }: Props) {
  const radius = compact ? 36 : 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const sizeClass = compact ? "h-24 w-24" : "h-32 w-32";
  const scoreClass = compact ? "text-2xl" : "text-3xl";

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className={`relative shrink-0 ${sizeClass}`}>
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink/5" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="text-teal transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-data font-bold text-ink ${scoreClass}`}>{score}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink">Overall Hiring Score</p>
          {percentile !== null && percentile >= 90 && (
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-teal">
              Top {100 - percentile}%
            </p>
          )}
          {percentile !== null && percentile < 90 && (
            <p className="mt-0.5 text-[10px] text-ink/40">Better than {percentile}% of employers</p>
          )}
          {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-ink/45">{hint}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink/5" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-teal transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data text-3xl font-bold text-ink">{score}</span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-ink">Overall Hiring Score</p>
      {percentile !== null && percentile >= 90 && (
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-teal">
          Top {100 - percentile}%
        </p>
      )}
      {percentile !== null && percentile < 90 && (
        <p className="mt-0.5 text-[10px] text-ink/40">Better than {percentile}% of employers</p>
      )}
      {hint && (
        <p className="mt-2 max-w-[180px] text-center text-[10px] leading-relaxed text-ink/45">
          {hint}
        </p>
      )}
    </div>
  );
}
