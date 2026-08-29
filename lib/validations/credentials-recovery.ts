import { z } from "zod";
import { normalizeEmail } from "@/lib/email-address";
import { passwordSchema } from "@/lib/validations/sign-up";

const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email is too long")
  .transform((value) => normalizeEmail(value));

// Raw token is opaque (base64url from crypto.randomBytes) — bound the length
// generously rather than pattern-matching, so this never has to change if the
// token encoding does.
const tokenSchema = z.string().min(16, "Invalid token").max(512, "Invalid token");

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema,
});

export const verifyEmailTokenSchema = tokenSchema;
