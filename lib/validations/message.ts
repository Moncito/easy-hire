import { z } from "zod";

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

export const conversationCreateSchema = z.object({
  // Employer-initiated path targets a seeker; seeker-initiated path targets
  // a company. Exactly one of the two is required, enforced in
  // lib/messaging/messages.ts (where the caller's role is known) rather than
  // here, since the same schema is shared by both directions.
  seekerId: z.string().min(1).optional(),
  companyId: z.string().min(1).optional(),
  jobId: z.string().optional().nullable(),
  initialMessage: z.string().trim().min(1).max(5000).optional(),
});

export type MessageCreate = z.infer<typeof messageCreateSchema>;
export type ConversationCreate = z.infer<typeof conversationCreateSchema>;
