import { z } from "zod";
import {
  employmentTypeSchema,
  remoteTypeSchema,
  salaryPeriodSchema,
  screeningQuestionInputSchema,
} from "@/lib/validations/job";
import { INDUSTRY_LABEL_SET, ROLE_TYPE_LABEL_SET } from "@/lib/constants/job-categories";

/** Empty string from a cleared form field means "no default". */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null);

const optionalLabel = (set: ReadonlySet<string>, message: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .optional()
    .transform((value) => value ?? null)
    .refine((value) => value === null || set.has(value), message);

export const APPLICANT_NOTE_MAX = 500;
/** Matches applicationUpdateSchema's rejectionReason cap, which the reject dialog enforces. */
export const REJECTION_MESSAGE_MAX = 500;

/**
 * Shared by the Settings form and PUT /api/employer/hiring-defaults. Uses the
 * job schemas' own enums and screening-question limits, so a default can
 * never pre-fill a job with something the job form would then reject.
 */
export const hiringDefaultsSchema = z.object({
  category: optionalLabel(ROLE_TYPE_LABEL_SET, "Choose a role type from the list"),
  industry: optionalLabel(INDUSTRY_LABEL_SET, "Choose an industry from the list"),
  employmentType: employmentTypeSchema.nullable().optional().transform((v) => v ?? null),
  remoteType: remoteTypeSchema.nullable().optional().transform((v) => v ?? null),
  salaryPeriod: salaryPeriodSchema.nullable().optional().transform((v) => v ?? null),
  location: optionalText(120, "Keep the location under 120 characters"),
  screeningQuestions: z
    .array(screeningQuestionInputSchema.extend({ prompt: screeningQuestionInputSchema.shape.prompt.trim() }))
    .max(5, "Up to 5 screening questions are allowed")
    .optional()
    .default([]),
  rejectionMessage: optionalText(REJECTION_MESSAGE_MAX, `Keep the message under ${REJECTION_MESSAGE_MAX} characters`),
  applicantNote: optionalText(APPLICANT_NOTE_MAX, `Keep the note under ${APPLICANT_NOTE_MAX} characters`),
});

export type HiringDefaultsInput = z.input<typeof hiringDefaultsSchema>;
export type HiringDefaults = z.output<typeof hiringDefaultsSchema>;
