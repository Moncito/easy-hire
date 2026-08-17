type Props = {
  percent: number;
  fill?: "ink" | "marigold";
  label: string;
};

const FILLS = {
  ink: "var(--pro-chart-ink, #20242B)",
  marigold: "#F2A93B",
} as const;

/** Single-track rate bar — empty track stays visible so sparse data still has a baseline. */
export default function ProMonoMeter({ percent, fill = "ink", label }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]"
      role="img"
      aria-label={`${label}: ${clamped}%`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${clamped}%`,
          backgroundColor: FILLS[fill],
          minWidth: clamped > 0 ? 6 : 0,
        }}
      />
    </div>
  );
}
