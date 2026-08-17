type Props = {
  values: number[];
  /** Ink for volume, marigold for hired / interview success. */
  fill?: "ink" | "marigold";
  label: string;
};

const FILLS = {
  ink: "var(--pro-chart-ink, #20242B)",
  marigold: "#F2A93B",
} as const;

/** Compact 7-bar spark — same ink/marigold language as the weekly chart. */
export default function ProMonoMiniBars({ values, fill = "ink", label }: Props) {
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <div
      className="flex h-10 items-end gap-[3px]"
      role="img"
      aria-label={`${label}. ${total} over the last ${values.length} days.`}
    >
      {values.map((value, index) => {
        const empty = value === 0;
        const height = empty ? 18 : Math.max((value / max) * 100, 22);

        return (
          <span
            key={`${label}-${index}`}
            className="min-w-0 flex-1 rounded-t-[3px]"
            style={{
              height: `${height}%`,
              backgroundColor: FILLS[fill],
              opacity: empty ? 0.12 : 1,
            }}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}
