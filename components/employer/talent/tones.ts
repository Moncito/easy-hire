/**
 * Tinted chips behind talent-profile icons. A plain module (not "use
 * client") so both server and client components can read the classes.
 */
export type SectionTone = "navy" | "teal" | "marigold";

export const TONE_CHIP: Record<SectionTone, string> = {
  navy: "bg-[color-mix(in_srgb,var(--eh-navy)_10%,var(--eh-surface))] text-eh-navy",
  teal: "bg-eh-teal-tint text-eh-teal-ink",
  marigold: "bg-eh-marigold-tint text-eh-marigold-ink",
};
