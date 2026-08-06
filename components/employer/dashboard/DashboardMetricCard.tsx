import Sparkline from "@/components/employer/charts/Sparkline";

type Props = {
  label: string;
  value: number;
  change: number | null;
  changeLabel: string;
  sparkline: number[];
  sparklineColor?: string;
  emptyHint?: string;
};

export default function DashboardMetricCard({
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
    <div className="rounded-2xl border border-ink/5 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{label}</p>
      {isEmpty && emptyHint ? (
        <div className="mt-2">
          <p className="font-data text-2xl font-bold text-ink/25">—</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ink/40">{emptyHint}</p>
        </div>
      ) : (
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="font-data text-2xl font-bold text-ink">{value}</p>
            {change !== null && (
              <p
                className={`mt-0.5 text-xs font-semibold ${change >= 0 ? "text-teal" : "text-ink/45"}`}
              >
                {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% {changeLabel}
              </p>
            )}
          </div>
          <Sparkline values={sparkline} color={sparklineColor} />
        </div>
      )}
    </div>
  );
}
