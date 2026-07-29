import { z } from "zod";

export type ProfileVisibilityLevel = "HIDDEN" | "STANDARD" | "PUBLIC";

const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .nullable();

export const profileVisibilitySchema = z.enum(["HIDDEN", "STANDARD", "PUBLIC"]);

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
  languages: z.array(z.string()).optional(),
  workExperience: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  resumes: z.array(z.string()).max(3).optional(),
  resumeLabel: z.string().max(120).optional().nullable(),
  timezone: z.string().max(64).optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
  visibility: profileVisibilitySchema.optional(),
  /** @deprecated Accept legacy boolean from old clients; maps to HIDDEN/STANDARD */
  profileVisibility: z.boolean().optional(),
});

export type SeekerUpdate = z.infer<typeof seekerUpdateSchema>;

export function resolveVisibility(input: SeekerUpdate): ProfileVisibilityLevel | undefined {
  if (input.visibility !== undefined) return input.visibility;
  if (input.profileVisibility === true) return "STANDARD";
  if (input.profileVisibility === false) return "HIDDEN";
  return undefined;
}

export function seekerInputToData(input: SeekerUpdate) {
  const visibility = resolveVisibility(input);

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
    ...(input.resumeUrl !== undefined
      ? {
          resumeUrl: input.resumeUrl || null,
          ...(input.resumeUrl ? { resumeUpdatedAt: new Date() } : { resumeUpdatedAt: null }),
        }
      : {}),
    ...(input.linkedinUrl !== undefined ? { linkedinUrl: input.linkedinUrl || null } : {}),
    ...(input.portfolioUrl !== undefined ? { portfolioUrl: input.portfolioUrl || null } : {}),
    ...(input.certifications !== undefined ? { certifications: input.certifications } : {}),
    ...(input.languages !== undefined ? { languages: input.languages } : {}),
    ...(input.workExperience !== undefined ? { workExperience: input.workExperience } : {}),
    ...(input.education !== undefined ? { education: input.education } : {}),
    ...(input.resumes !== undefined ? { resumes: input.resumes.slice(0, 3) } : {}),
    ...(input.resumeLabel !== undefined ? { resumeLabel: input.resumeLabel || null } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone || "Asia/Manila" } : {}),
    ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl || null } : {}),
    ...(visibility !== undefined ? { visibility } : {}),
  };
}
