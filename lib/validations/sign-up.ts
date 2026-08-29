import { z } from "zod";
import { normalizeEmail } from "@/lib/email-address";

export const roleSchema = z.enum(["SEEKER", "EMPLOYER"]);

// Shared across every credentials-based form: trims and lowercases so
// lookups (findUnique on the @unique User.email column) are case-insensitive
// and duplicate accounts can't be created by casing alone.
const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(254, "Email is too long")
  .transform((value) => normalizeEmail(value));

// bcrypt only considers the first 72 bytes of a password — cap input length
// to match, and to bound the cost of hashing an attacker-supplied string.
// Exported so every password-setting flow (sign-up, reset) shares one rule set.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const credentialsSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters").max(200, "Name is too long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Payload accepted by POST /api/register. fullName / companyName stay
// optional (and are not required to be non-empty) to preserve the route's
// existing behaviour of defaulting to an empty string when omitted.
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  fullName: z.string().max(200, "Name is too long").optional(),
  companyName: z.string().max(200, "Company name is too long").optional(),
});

export const seekerOnboardingSchema = z.object({
  skills: z.array(z.string()).optional().default([]),
  availability: z.string().optional(),
  yearsExperience: z.string().optional(),
});

export const employerOnboardingSchema = z.object({
  industry: z.string().optional(),
  teamSize: z.string().optional(),
});