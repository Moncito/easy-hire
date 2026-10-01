import type { PipelineStageTone } from "@/components/employer/system";

/**
 * Pipeline stages for the Pro applicants board, in the same colours as
 * every other pipeline bar in the workspace: ink for unreviewed, teal
 * darkening through shortlisted → interview → hired, and Ember only for
 * rejected (a genuine rejection).
 */
export const PRO_STAGES = [
  {
    status: "APPLIED",
    label: "Applied",
    tone: "ink",
    dot: "bg-eh-ink",
    emptyHint: "New applications land here first.",
  },
  {
    status: "SHORTLISTED",
    label: "Shortlisted",
    tone: "teal-soft",
    dot: "bg-[color-mix(in_srgb,var(--eh-teal)_45%,var(--eh-surface))]",
    emptyHint: "Promising candidates to look at more closely.",
  },
  {
    status: "INTERVIEW",
    label: "Interview",
    tone: "teal",
    dot: "bg-eh-teal",
    emptyHint: "Candidates you're actively evaluating.",
  },
  {
    status: "HIRED",
    label: "Hired",
    tone: "teal-strong",
    dot: "bg-eh-teal-ink",
    emptyHint: "Successful hires for this role.",
  },
] as const satisfies ReadonlyArray<{
  status: string;
  label: string;
  tone: PipelineStageTone;
  dot: string;
  emptyHint: string;
}>;

export const PRO_REJECTED_STAGE = {
  status: "REJECTED",
  label: "Rejected",
  dot: "bg-eh-danger",
  emptyHint: "Candidates you passed on.",
} as const;
