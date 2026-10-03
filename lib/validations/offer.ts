import { z } from "zod";

/** How long a PENDING offer stays open before it is treated as EXPIRED. */
export const OFFER_TTL_DAYS = 7;

export const createOfferSchema = z.object({
  title: z.string().trim().min(1).max(120),
  rateType: z.enum(["MONTHLY", "HOURLY"]),
  rateCents: z.number().int().positive().max(100_000_000), // $1,000,000 cap
  currency: z.enum(["USD", "PHP"]).default("USD"),
  hoursPerWeek: z.number().int().min(1).max(80).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD
  message: z.string().trim().max(2000).optional(),
});

export const respondToOfferSchema = z.discriminatedUnion("accept", [
  z.object({ accept: z.literal(true) }),
  z.object({ accept: z.literal(false), declineReason: z.string().trim().max(500).optional() }),
]);

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;
