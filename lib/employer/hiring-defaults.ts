import { prisma } from "@/lib/prisma";
import { hiringDefaultsSchema, type HiringDefaults } from "@/lib/validations/hiring-defaults";
import { screeningQuestionInputSchema } from "@/lib/validations/job";
import { INDUSTRY_LABEL_SET } from "@/lib/constants/job-categories";

/**
 * HIRING DEFAULTS
 * ===============
 * Company-level pre-fills (CompanyHiringDefaults). Nothing here is ever
 * applied behind anyone's back:
 *  - new jobs start from the job details and screening questions, and the
 *    person posting can change anything before saving;
 *  - the reject dialog starts from the rejection message, still editable;
 *  - the applicant note is added to the "application received" email.
 * Editing a default never reaches an existing job or a message already sent.
 */

export const EMPTY_HIRING_DEFAULTS: HiringDefaults = {
  category: null,
  industry: null,
  employmentType: null,
  remoteType: null,
  salaryPeriod: null,
  location: null,
  screeningQuestions: [],
  rejectionMessage: null,
  applicantNote: null,
};

const storedQuestionsSchema = screeningQuestionInputSchema.array().max(5);

/**
 * The JSON column is only ever written through hiringDefaultsSchema, but it's
 * still JSON: a row that doesn't parse (hand-edited, or from a future shape)
 * yields no questions rather than breaking the job form.
 */
export function parseStoredScreeningQuestions(value: unknown): HiringDefaults["screeningQuestions"] {
  const parsed = storedQuestionsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export async function getHiringDefaults(companyId: string): Promise<HiringDefaults> {
  const row = await prisma.companyHiringDefaults.findUnique({ where: { companyId } });
  if (!row) return EMPTY_HIRING_DEFAULTS;
  return {
    category: row.category,
    industry: row.industry,
    employmentType: row.employmentType,
    remoteType: row.remoteType,
    salaryPeriod: row.salaryPeriod,
    location: row.location,
    screeningQuestions: parseStoredScreeningQuestions(row.screeningQuestions),
    rejectionMessage: row.rejectionMessage,
    applicantNote: row.applicantNote,
  };
}

export async function saveHiringDefaults(companyId: string, raw: unknown): Promise<HiringDefaults> {
  const input = hiringDefaultsSchema.parse(raw);
  await prisma.companyHiringDefaults.upsert({
    where: { companyId },
    create: { companyId, ...input },
    update: input,
  });
  return input;
}

/** What a new-job page passes to JobForm as `initialData`, for either posting path (owner or team workspace). */
export async function getNewJobPrefill(companyId: string) {
  const [defaults, company] = await Promise.all([
    getHiringDefaults(companyId),
    prisma.company.findUnique({ where: { id: companyId }, select: { industry: true } }),
  ]);
  return hiringDefaultsToJobPrefill(defaults, company?.industry ?? null);
}

/**
 * Pure. The pre-fill a new job form starts from, in the form's own string
 * shape (see JobFormData). Only fields with a default are returned, so the
 * form's built-in fallbacks (Full-time, Remote, Monthly) still apply to the
 * rest. The company's own industry stands in when no default industry is set.
 */
export function hiringDefaultsToJobPrefill(
  defaults: HiringDefaults,
  companyIndustry: string | null
): {
  category?: string;
  industry?: string;
  employmentType?: string;
  remoteType?: string;
  salaryPeriod?: string;
  location?: string;
  screeningQuestions?: Array<{ prompt: string; required: boolean }>;
} {
  // Company.industry is free text; only borrow it when it's one of the job
  // form's options, or the select would hold a value it can't display.
  const fallbackIndustry = companyIndustry && INDUSTRY_LABEL_SET.has(companyIndustry) ? companyIndustry : null;
  const industry = defaults.industry ?? fallbackIndustry;
  return {
    ...(defaults.category ? { category: defaults.category } : {}),
    ...(industry ? { industry } : {}),
    ...(defaults.employmentType ? { employmentType: defaults.employmentType } : {}),
    ...(defaults.remoteType ? { remoteType: defaults.remoteType } : {}),
    ...(defaults.salaryPeriod ? { salaryPeriod: defaults.salaryPeriod } : {}),
    ...(defaults.location ? { location: defaults.location } : {}),
    ...(defaults.screeningQuestions.length > 0
      ? { screeningQuestions: defaults.screeningQuestions.map((q) => ({ prompt: q.prompt, required: q.required })) }
      : {}),
  };
}
