type Kpi = {
  label: string;
  value: string | number;
  detail: string;
};

/**
 * Four numbers, each one self-explanatory. Replaces the sidebar stack whose
 * "Score" had no explanation on the page.
 */
export default function ProKpiRow({ items }: { items: Kpi[] }) {
  return (
    <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((kpi) => (
        <div key={kpi.label} className="pro-card px-4 py-3.5 sm:px-5">
          <p className="text-[13px] font-medium text-ink/60">{kpi.label}</p>
          <p className="mt-1 font-data text-2xl font-bold tabular-nums text-ink">{kpi.value}</p>
          <p className="mt-0.5 truncate text-xs text-ink/45">{kpi.detail}</p>
        </div>
      ))}
    </section>
  );
}
