type Props = {
  score: number;
  percentile: number | null;
  hint?: string | null;
  compact?: boolean;
};

/** Pro drop-in replacement for HiringScoreGauge — inset well with a raised
 * gold-accented ring, matching the "convex-in-concave" motif from the
 * design spec (used for the hiring gauge / Easy AI orb). */
export default function NeoGauge({ score, percentile, hint, compact = false }: Props) {
  const radius = compact ? 36 : 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const sizeClass = compact ? "h-24 w-24" : "h-32 w-32";
  const scoreClass = compact ? "text-2xl" : "text-3xl";

  return (
    <div className="flex flex-col items-center">
      <div className={`neo-inset relative rounded-full ${sizeClass}`}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-[color:var(--neo-muted)] opacity-20"
          />
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
            className="text-[color:var(--neo-gold)] transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-data font-bold text-[color:var(--neo-ink)] ${scoreClass}`}>
            {score}
          </span>
        </div>
      </div>
      <p className="mt-2.5 text-center text-xs font-semibold text-[color:var(--neo-ink)]">
        Overall Hiring Score
      </p>
      {percentile !== null && percentile >= 90 && (
        <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-[color:var(--neo-gold)]">
          Top {100 - percentile}%
        </p>
      )}
      {percentile !== null && percentile < 90 && (
        <p className="mt-0.5 text-[10px] text-[color:var(--neo-muted)]">
          Better than {percentile}% of employers
        </p>
      )}
      {hint && (
        <p className="mt-2 max-w-[180px] text-center text-[10px] leading-relaxed text-[color:var(--neo-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
