type Metric = {
  label: string;
  value: number | string;
  href?: string;
};

type Props = {
  metrics: Metric[];
};

export default function EmployerMetricStrip({ metrics }: Props) {
  return (
    <div className="mb-8 flex flex-wrap items-baseline gap-x-1 gap-y-2 text-sm">
      {metrics.map((metric, i) => (
        <span key={metric.label} className="inline-flex items-baseline gap-1">
          {i > 0 && <span className="mx-2 text-ink/20" aria-hidden="true">·</span>}
          <span className="font-data text-base font-semibold tabular-nums text-ink">
            {metric.value}
          </span>
          <span className="text-ink/45">{metric.label}</span>
        </span>
      ))}
    </div>
  );
}
