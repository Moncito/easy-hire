import { z } from "zod";

export const messageCreateSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

export const conversationCreateSchema = z.object({
  seekerId: z.string().min(1),
  jobId: z.string().optional().nullable(),
  initialMessage: z.string().trim().min(1).max(5000).optional(),
});

export type MessageCreate = z.infer<typeof messageCreateSchema>;
export type ConversationCreate = z.infer<typeof conversationCreateSchema>;
