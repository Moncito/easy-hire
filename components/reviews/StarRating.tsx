import { Star } from "lucide-react";

export type StarRatingSize = "sm" | "md" | "lg";
export type StarRatingAccent = "marigold" | "teal" | "navy";

type Props = {
  /** Rating out of 5. Accepts a fraction (e.g. 4.3) for an aggregate average. */
  value: number;
  /**
   * Total number of ratings behind `value`. Pass this for an aggregate
   * display (renders "4.3 (12)"); omit it for a single review's own rating
   * (renders just the number, e.g. "5").
   */
  count?: number;
  size?: StarRatingSize;
  /** Fill color — follows the author's side per the brand rules (seeker = marigold, employer = teal). */
  accent?: StarRatingAccent;
  className?: string;
};

const SIZE_PX: Record<StarRatingSize, number> = { sm: 14, md: 18, lg: 24 };
const TEXT_SIZE: Record<StarRatingSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const ACCENT_HEX: Record<StarRatingAccent, string> = {
  marigold: "#F2A93B",
  teal: "#1F8073",
  navy: "#1E3A5F",
};

/**
 * Presentational 1–5 star display. Not just colored glyphs — a screen reader
 * gets nothing from star characters/icons alone, so the whole star cluster is
 * a single `role="img"` with a text `aria-label` conveying the numeric
 * rating, and the individual star icons are `aria-hidden`.
 */
export default function StarRating({ value, count, size = "md", accent = "marigold", className = "" }: Props) {
  const clamped = Math.max(0, Math.min(5, value));
  const px = SIZE_PX[size];
  const color = ACCENT_HEX[accent];
  const labelValue = Math.round(clamped * 10) / 10;
  const display = typeof count === "number" ? clamped.toFixed(1) : String(Math.round(clamped));
  const label =
    typeof count === "number"
      ? `${labelValue} out of 5 stars, based on ${count} review${count === 1 ? "" : "s"}`
      : `${labelValue} out of 5 stars`;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={label}
    >
      <span className="relative inline-flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, clamped - i));
          return (
            <span key={i} className="relative inline-block shrink-0" style={{ width: px, height: px }}>
              <Star
                className="absolute inset-0 text-ink/15"
                style={{ width: px, height: px }}
                strokeWidth={1.75}
              />
              {fill > 0 && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star
                    className="absolute inset-0"
                    style={{ width: px, height: px, color, fill: color }}
                    strokeWidth={1.75}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className={`font-data ${TEXT_SIZE[size]} font-semibold text-ink/55`} aria-hidden="true">
        {display}
        {typeof count === "number" && <span className="text-ink/40"> ({count})</span>}
      </span>
    </span>
  );
}
