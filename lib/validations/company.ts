import { z } from "zod";

export const companyUpdateSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  teamSize: z.string().optional().nullable(),
  foundedYear: z.union([z.number(), z.string()]).optional().nullable(),
  headquarters: z.string().optional().nullable(),
  highlights: z.array(z.string()).optional().default([]),
  linkedinUrl: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  xUrl: z.string().optional().nullable(),
});

export type CompanyUpdate = z.infer<typeof companyUpdateSchema>;

export const employerOnboardingUpdateSchema = z.object({
  industry: z.string().max(100, "Industry is too long").optional(),
  teamSize: z.string().max(50, "Team size is too long").optional(),
});

export function companyInputToData(input: CompanyUpdate) {
  const emptyToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  const foundedYear =
    input.foundedYear === null || input.foundedYear === undefined || input.foundedYear === ""
      ? null
      : typeof input.foundedYear === "number"
        ? input.foundedYear
        : parseInt(String(input.foundedYear), 10);

  return {
    companyName: input.companyName,
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
    ...(input.bannerUrl !== undefined ? { bannerUrl: input.bannerUrl || null } : {}),
    description: input.description || null,
    website: emptyToNull(input.website ?? null),
    industry: input.industry || null,
    teamSize: input.teamSize || null,
    foundedYear: foundedYear && !Number.isNaN(foundedYear) ? foundedYear : null,
    headquarters: input.headquarters || null,
    highlights: input.highlights ?? [],
    linkedinUrl: emptyToNull(input.linkedinUrl ?? null),
    facebookUrl: emptyToNull(input.facebookUrl ?? null),
    instagramUrl: emptyToNull(input.instagramUrl ?? null),
    xUrl: emptyToNull(input.xUrl ?? null),
  };
}
