/** Pro pipeline stage colors. Teal = hired/success only. Ember = rejected only.
 * Marigold = shortlist prestige. Navy = interview. Ink = applied. */

export const PRO_STAGE_DOT: Record<string, string> = {
  APPLIED: "bg-ink",
  SHORTLISTED: "bg-marigold",
  INTERVIEW: "bg-navy",
  HIRED: "bg-teal",
  REJECTED: "bg-ember",
};

export const PRO_STAGE_COLUMN: Record<string, string> = {
  APPLIED: "border-ink/10 bg-ink/[0.04]",
  SHORTLISTED: "border-marigold/25 bg-marigold/[0.12]",
  INTERVIEW: "border-navy/15 bg-navy/[0.07]",
  HIRED: "border-teal/25 bg-teal/[0.10]",
  REJECTED: "border-ember/20 bg-ember/[0.08]",
};

export const PRO_STAGE_CHIP_ACTIVE: Record<string, string> = {
  APPLIED: "border-ink/20 bg-ink/[0.06] text-ink",
  SHORTLISTED: "border-marigold/40 bg-marigold/15 text-ink",
  INTERVIEW: "border-navy/25 bg-navy/10 text-navy",
  HIRED: "border-teal/30 bg-teal/10 text-teal",
  REJECTED: "border-ember/30 bg-ember/10 text-ember",
};

export const PRO_STAGE_CARD_ACCENT: Record<string, string> = {
  APPLIED: "border-l-[3px] border-l-ink/35",
  SHORTLISTED: "border-l-[3px] border-l-marigold",
  INTERVIEW: "border-l-[3px] border-l-navy",
  HIRED: "border-l-[3px] border-l-teal",
  REJECTED: "border-l-[3px] border-l-ember",
};
