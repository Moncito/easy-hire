"use client";

import { useId } from "react";
import { Star } from "lucide-react";

export type RatingInputAccent = "marigold" | "teal";

type Props = {
  /** Currently selected rating, or null when nothing has been picked yet. */
  value: number | null;
  onChange: (value: number) => void;
  accent?: RatingInputAccent;
  disabled?: boolean;
  /** Ties the group to a validation error message rendered by the caller. */
  invalid?: boolean;
  describedBy?: string;
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;
const LABELS = ["1 star", "2 stars", "3 stars", "4 stars", "5 stars"];
const ACCENT_HEX: Record<RatingInputAccent, string> = { marigold: "#F2A93B", teal: "#1F8073" };
const ACCENT_RING: Record<RatingInputAccent, string> = {
  marigold: "focus-within:ring-marigold",
  teal: "focus-within:ring-teal",
};

/**
 * Interactive 1–5 star rating picker. A real fieldset of radio inputs (not
 * div click handlers) so it's keyboard-operable out of the box — arrow keys
 * move between options per native radiogroup behavior since every input
 * shares one `name`. The inputs are visually hidden (`sr-only`), not
 * removed, so screen readers and keyboard users still get the native
 * control; the star icon is purely decorative (`aria-hidden`) and driven by
 * the hidden input's checked state.
 */
export default function RatingInput({
  value,
  onChange,
  accent = "marigold",
  disabled = false,
  invalid = false,
  describedBy,
}: Props) {
  const groupId = useId();
  const fieldName = `rating-${groupId}`;
  const color = ACCENT_HEX[accent];

  return (
    <fieldset
      className="flex flex-col gap-2"
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    >
      <legend className="text-xs font-semibold uppercase tracking-wider text-ink/45">Your rating</legend>
      <div className="flex items-center gap-1">
        {STAR_VALUES.map((star) => {
          const filled = value !== null && star <= value;
          return (
            <label
              key={star}
              className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg outline-none transition focus-within:ring-2 focus-within:ring-offset-2 ${ACCENT_RING[accent]} ${
                disabled ? "cursor-not-allowed opacity-50" : "hover:bg-ink/5"
              }`}
            >
              <input
                type="radio"
                name={fieldName}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                disabled={disabled}
                aria-label={LABELS[star - 1]}
                className="sr-only"
              />
              <Star
                aria-hidden="true"
                className="h-6 w-6 transition"
                style={{ color: filled ? color : "rgba(32,36,43,0.18)", fill: filled ? color : "transparent" }}
                strokeWidth={1.75}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
