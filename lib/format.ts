export function formatPesoRange(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return "Not specified";

  const fmt = (n: number) => `₱${n.toLocaleString("en-PH")}`;

  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}/mo`;
  if (min != null) return `From ${fmt(min)}/mo`;
  return `Up to ${fmt(max!)}/mo`;
}

export function formatEnumLabel(value: string) {
  return value.replace(/_/g, " ");
}
