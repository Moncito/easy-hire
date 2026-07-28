import { z } from "zod";

const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .nullable();

export const seekerUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required").optional(),
  phone: z.string().max(30).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  headline: z.string().max(120).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  skills: z.array(z.string()).optional(),
  availability: z.string().optional().nullable(),
  yearsExperience: z.string().optional().nullable(),
  desiredSalaryMin: z.number().int().positive().optional().nullable(),
  desiredSalaryMax: z.number().int().positive().optional().nullable(),
  resumeUrl: z.string().url().optional().nullable(),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  certifications: z.array(z.string()).optional(),
  photoUrl: z.string().url().optional().nullable(),
  profileVisibility: z.boolean().optional(),
});

export type SeekerUpdate = z.infer<typeof seekerUpdateSchema>;

export function seekerInputToData(input: SeekerUpdate) {
  return {
    ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
    ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
    ...(input.location !== undefined ? { location: input.location || null } : {}),
    ...(input.headline !== undefined ? { headline: input.headline || null } : {}),
    ...(input.bio !== undefined ? { bio: input.bio || null } : {}),
    ...(input.skills !== undefined ? { skills: input.skills } : {}),
    ...(input.availability !== undefined ? { availability: input.availability || null } : {}),
    ...(input.yearsExperience !== undefined ? { yearsExperience: input.yearsExperience || null } : {}),
    ...(input.desiredSalaryMin !== undefined ? { desiredSalaryMin: input.desiredSalaryMin } : {}),
    ...(input.desiredSalaryMax !== undefined ? { desiredSalaryMax: input.desiredSalaryMax } : {}),
    ...(input.resumeUrl !== undefined ? { resumeUrl: input.resumeUrl || null } : {}),
    ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl || null } : {}),
    ...(input.portfolioUrl !== undefined ? { portfolioUrl: input.portfolioUrl || null } : {}),
    ...(input.certifications !== undefined ? { certifications: input.certifications } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl || null } : {}),
    ...(input.profileVisibility !== undefined ? { profileVisibility: input.profileVisibility } : {}),
  };
}
