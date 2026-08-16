import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Kpi = {
  label: string;
  value: string | number;
  change?: number | null;
  changeLabel?: string;
  icon: LucideIcon;
  accent?: "teal" | "navy" | "ember";
};

type Props = {
  items: Kpi[];
};

const accentBg: Record<NonNullable<Kpi["accent"]>, string> = {
  teal: "bg-teal/10 text-teal",
  navy: "bg-navy/10 text-navy",
  ember: "bg-ember/10 text-ember",
};

export default function ProKpiRow({ items }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const accent = item.accent ?? "teal";
        const change = item.change;
        const positive = change != null && change >= 0;

        return (
          <div key={item.label} className="pro-card p-6">
            <div className="flex items-start justify-between gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentBg[accent]}`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              {change != null && (
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                    positive ? "text-teal" : "text-ember"
                  }`}
                >
                  {positive ? (
                    <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                  )}
                  {Math.abs(change)}%
                  {item.changeLabel && (
                    <span className="font-normal text-ink/40">{item.changeLabel}</span>
                  )}
                </span>
              )}
            </div>
            <p className="mt-5 text-sm font-medium text-ink/45">{item.label}</p>
            <p className="font-data mt-1.5 text-4xl font-bold tracking-tight text-ink">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
