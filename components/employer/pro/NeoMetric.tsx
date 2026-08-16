import Sparkline from "@/components/employer/charts/Sparkline";
import NeoSurface from "@/components/employer/pro/NeoSurface";

type Props = {
  label: string;
  value: number;
  change: number | null;
  changeLabel: string;
  sparkline: number[];
  sparklineColor?: string;
  emptyHint?: string;
};

/** Pro drop-in replacement for DashboardMetricCard — same data shape,
 * neomorphic raised surface + gold accent for positive change. */
export default function NeoMetric({
  label,
  value,
  change,
  changeLabel,
  sparkline,
  sparklineColor,
  emptyHint,
}: Props) {
  const isEmpty = value === 0 && sparkline.every((v) => v === 0);

  return (
    <NeoSurface variant="raised" className="p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-muted)]">
        {label}
      </p>
      {isEmpty && emptyHint ? (
        <div className="mt-2">
          <p className="font-data text-2xl font-bold text-[color:var(--neo-muted)] opacity-50">—</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--neo-muted)]">
            {emptyHint}
          </p>
        </div>
      ) : (
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="font-data text-2xl font-bold text-[color:var(--neo-ink)]">{value}</p>
            {change !== null && (
              <p
                className={`mt-0.5 text-xs font-semibold ${
                  change >= 0 ? "text-[color:var(--neo-teal)]" : "text-[color:var(--neo-muted)]"
                }`}
              >
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% {changeLabel}
              </p>
            )}
          </div>
          <Sparkline values={sparkline} color={sparklineColor} />
        </div>
      )}
    </NeoSurface>
  );
}
