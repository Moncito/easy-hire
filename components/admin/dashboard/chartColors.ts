/**
 * Validated sparkline color ramp for Band 1's two single-metric trend
 * charts — run through this codebase's `dataviz` skill palette validator
 * against Harbor Navy (`#1E3A5F`) and iterated until it passed every check.
 * Use these exact values; do not invent or re-derive new ones.
 */
export const SPARKLINE_COLORS: Record<
  "light" | "dark",
  { stroke: string; fill: string; fillOpacity: number; reference: string }
> = {
  light: {
    stroke: "#1E3A5F",
    fill: "#7E8FA6",
    fillOpacity: 0.15,
    reference: "#7E8FA6",
  },
  dark: {
    stroke: "#9EB3CC",
    fill: "#3A5578",
    fillOpacity: 0.15,
    reference: "#6B84A3",
  },
};
