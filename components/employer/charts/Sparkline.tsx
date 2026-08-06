type Props = {
  values: number[];
  color?: string;
  height?: number;
};

export default function Sparkline({ values, color = "#1F8073", height = 32 }: Props) {
  if (values.length === 0) return null;

  const max = Math.max(...values, 1);
  const width = 64;
  const step = width / Math.max(values.length - 1, 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
