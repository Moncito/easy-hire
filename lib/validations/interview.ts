import { z } from "zod";

export const respondToInterviewSchema = z.object({
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

export type RespondToInterviewInput = z.infer<typeof respondToInterviewSchema>;
