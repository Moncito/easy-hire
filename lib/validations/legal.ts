import { z } from "zod";

export const acceptTermsSchema = z.object({
  version: z.string().min(1).max(32),
});
