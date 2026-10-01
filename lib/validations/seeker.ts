import { z } from "zod";
import { TIMEZONE_OPTIONS } from "@/lib/seeker/profile-format";

export type ProfileVisibilityLevel = "HIDDEN" | "STANDARD" | "PUBLIC";

const TIMEZONE_VALUES: readonly string[] = TIMEZONE_OPTIONS.map((t) => t.value);

const optionalUrl = z
  .union([z.string().url(), z.literal("")])
  .optional()
  .nullable();

/**
 * Resumes live in a private bucket and are now persisted as a bare object
 * path (`${userId}/${timestamp}-${name}`), not a full URL — only signed at
 * read time. Accept either shape so legacy full-URL rows and new
 * object-path rows both validate. (`photoUrl` stays a full URL — photos
 * remain in a public bucket.)
 */
const urlOrObjectPath = z
  .string()
  .max(2048)
  .refine((value) => value.length > 0 && !/\s/.test(value), "Must be a valid URL or file path");

export const profileVisibilitySchema = z.enum(["HIDDEN", "STANDARD", "PUBLIC"]);

/** Digits, spaces, and + - ( ) only, with at least 7 digits — loose on purpose (no country-specific format), just enough to reject obvious garbage. Empty string passes through (means "clear the field"). */
const phoneSchema = z
  .string()
  .max(30)
  .refine((v) => v.length === 0 || /^[+()\-.\s\d]+$/.test(v), "Phone can only contain digits, spaces, and + - ( )")
  .refine((v) => v.length === 0 || (v.match(/\d/g)?.length ?? 0) >= 7, "Phone number is too short")
  .optional()
  .nullable();

/** Restricted to the same list the profile editor's timezone dropdown offers (lib/seeker/profile-format.ts's TIMEZONE_OPTIONS) — there's no free-text timezone entry point in the UI, so anything else is either a bug or a stale client. Empty string passes through; seekerInputToData defaults it to "Asia/Manila". */
const timezoneSchema = z
  .string()
  .max(64)
  .refine((v) => v.length === 0 || TIMEZONE_VALUES.includes(v), "Unsupported timezone")
  .optional()
  .nullable();

export const seekerUpdateSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required").optional(),
    phone: phoneSchema,
    location: z.string().max(120).optional().nullable(),
    headline: z.string().max(120).optional().nullable(),
    bio: z.string().max(2000).optional().nullable(),
    skills: z.array(z.string()).max(40, "Up to 40 skills").optional(),
    availability: z.string().optional().nullable(),
    yearsExperience: z.string().optional().nullable(),
    desiredSalaryMin: z.number().int().positive().optional().nullable(),
    desiredSalaryMax: z.number().int().positive().optional().nullable(),
    resumeUrl: urlOrObjectPath.optional().nullable(),
    linkedinUrl: optionalUrl,
    portfolioUrl: optionalUrl,
    certifications: z.array(z.string()).max(20, "Up to 20 certifications").optional(),
    languages: z.array(z.string()).max(12, "Up to 12 languages").optional(),
    workExperience: z.array(z.string()).max(25, "Up to 25 roles").optional(),
    education: z.array(z.string()).max(10, "Up to 10 entries").optional(),
    resumes: z.array(z.string().max(2048)).max(3).optional(),
    resumeLabel: z.string().max(120).optional().nullable(),
    timezone: timezoneSchema,
    photoUrl: z.string().url().optional().nullable(),
    visibility: profileVisibilitySchema.optional(),
  })
  .refine(
    (data) =>
      data.desiredSalaryMin == null || data.desiredSalaryMax == null || data.desiredSalaryMin <= data.desiredSalaryMax,
    { message: "Minimum salary can't be more than maximum salary", path: ["desiredSalaryMax"] }
  );

export type SeekerUpdate = z.infer<typeof seekerUpdateSchema>;

export function resolveVisibility(input: SeekerUpdate): ProfileVisibilityLevel | undefined {
  return input.visibility;
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
