import { z } from "zod";

export const roleSchema = z.enum(["SEEKER", "EMPLOYER"]);

export const credentialsSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
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