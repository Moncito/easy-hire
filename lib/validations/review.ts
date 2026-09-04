import { z } from "zod";

/**
 * Body length bounds:
 * - max 2000 matches this codebase's established ceiling for a substantial
 *   free-text field (`coverNote` in application.ts, `bio` in seeker.ts both
 *   cap at 2000) — no reason for reviews to be an exception.
 * - min 40 is new to this schema and specific to reviews: this is the
 *   product's differentiator (two-way, non-gameable reviews), and a one-word
 *   "Great!" / "Avoid" carries no signal and defeats the point of unlocking
 *   it behind a real HIRED relationship. 40 characters is roughly one short
 *   sentence — enough to force something substantive without being an
 *   onerous essay requirement.
 */
export const reviewSubmitSchema = z.object({
  applicationId: z.string().min(1, "applicationId is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  body: z
    .string()
    .trim()
    .min(40, "Please write at least a few sentences (40 characters minimum).")
    .max(2000, "Review is too long (2000 characters maximum)."),
});

export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;

/**
 * Dispute reason: shorter than a review body (it's a moderation flag, not
 * the public-facing content) but still requires enough text to give an
 * admin something to act on — min 10 rules out a bare "no" or "wrong".
 * Max 1000 matches the existing `rejectionReason` cap
 * (lib/validations/collaborative-review.ts) used for a similarly-scoped
 * "explain yourself" field elsewhere in the app.
 */
export const reviewDisputeSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Please explain why you're disputing this review (10 characters minimum).")
    .max(1000, "Dispute reason is too long (1000 characters maximum)."),
});

export type ReviewDisputeInput = z.infer<typeof reviewDisputeSchema>;

/**
 * Admin resolution of a DISPUTED review: restore it to PUBLISHED (dispute
 * was unfounded) or HIDDEN (dispute was valid — review stays off both public
 * surfaces but the row is kept, not deleted, for audit history). `note` cap
 * of 500 matches `adminCompanyReviewSchema`/`adminJobReviewSchema`'s `reason`
 * field (lib/validations/admin.ts) — the existing bound for an admin's
 * internal rationale text.
 */
export const adminReviewResolveSchema = z.object({
  action: z.enum(["restore", "hide"]),
  note: z.string().trim().max(500, "Note is too long (500 characters maximum).").optional(),
});

export type AdminReviewResolveInput = z.infer<typeof adminReviewResolveSchema>;
