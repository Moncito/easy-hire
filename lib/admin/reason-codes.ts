/**
 * Controlled reason-code vocabularies for admin REJECT decisions —
 * docs/ADMIN-CONSOLE-PLAN.md §4.2: "Decision reasons are a controlled
 * vocabulary, not free text... you will want to ask 'why do we reject 40% of
 * companies in this industry'."
 *
 * Stored as plain TEXT in `admin_audit_logs.reason_code` (see
 * prisma/schema.prisma — the column already exists from Phase 0), NEVER a
 * Postgres enum, so adding a code later is a one-line change to the arrays
 * below, not a migration.
 *
 * Each vocabulary is scoped to exactly one decision path:
 *  - COMPANY_VERIFICATION_REASON_CODES -> lib/admin/companies.ts reviewCompany (reject)
 *  - JOB_POST_REASON_CODES             -> lib/admin/jobs.ts reviewJob (reject)
 *  - SEEKER_ID_REASON_CODES            -> lib/admin/seekers.ts reviewSeekerVerification (reject)
 *
 * There is deliberately no fourth vocabulary for review-dispute resolution
 * (lib/reviews.ts resolveDisputedReview) in this phase — only these three
 * were commissioned. `reasonCode` is still threaded through that decision
 * path (see lib/validations/review.ts), but accepted as a free-form optional
 * string rather than validated against a controlled list.
 *
 * Labels are operator-facing: a reviewer reads these under time pressure, so
 * every label must be unambiguous at a glance without needing the code next
 * to it.
 */

export const COMPANY_VERIFICATION_REASON_CODES = [
  { code: "DOCS_ILLEGIBLE", label: "Documents are illegible or unreadable" },
  { code: "DOCS_MISMATCH", label: "Documents don't match the claimed company" },
  { code: "DOCS_EXPIRED", label: "Submitted documents are expired" },
  { code: "NOT_A_REAL_BUSINESS", label: "No evidence this is a real, operating business" },
  { code: "SUSPECTED_FRAUD", label: "Suspected fraudulent registration" },
  { code: "DUPLICATE_ACCOUNT", label: "Duplicate of an existing company account" },
  { code: "INCOMPLETE_PROFILE", label: "Company profile is missing required information" },
  { code: "OTHER", label: "Other (see note)" },
] as const;

export type CompanyVerificationReasonCode = (typeof COMPANY_VERIFICATION_REASON_CODES)[number]["code"];

export const JOB_POST_REASON_CODES = [
  { code: "MISLEADING_PAY", label: "Pay described is misleading or inaccurate" },
  { code: "NO_PAY_STATED", label: "No pay or compensation stated" },
  { code: "UPFRONT_FEE_REQUESTED", label: "Job requires an upfront fee or payment from applicants" },
  { code: "OFF_PLATFORM_CONTACT", label: "Pushes applicants to contact off-platform before hire" },
  { code: "VAGUE_OR_LOW_QUALITY", label: "Posting is too vague or low quality to review" },
  { code: "DISCRIMINATORY", label: "Contains discriminatory requirements or language" },
  { code: "NOT_A_VA_ROLE", label: "Not a virtual assistant / remote-support role" },
  { code: "DUPLICATE_POSTING", label: "Duplicate of an existing active posting" },
  { code: "SUSPECTED_SCAM", label: "Suspected scam or fraudulent listing" },
  { code: "OTHER", label: "Other (see note)" },
] as const;

export type JobPostReasonCode = (typeof JOB_POST_REASON_CODES)[number]["code"];

export const SEEKER_ID_REASON_CODES = [
  { code: "DOC_ILLEGIBLE", label: "Document is illegible or unreadable" },
  { code: "NAME_MISMATCH", label: "Name on document doesn't match profile name" },
  { code: "DOC_EXPIRED", label: "Document is expired" },
  { code: "SUSPECTED_FORGERY", label: "Suspected forged or altered document" },
  { code: "DUPLICATE_IDENTITY", label: "Document matches another existing account" },
  { code: "OTHER", label: "Other (see note)" },
] as const;

export type SeekerIdReasonCode = (typeof SEEKER_ID_REASON_CODES)[number]["code"];

export type ReasonCode = CompanyVerificationReasonCode | JobPostReasonCode | SeekerIdReasonCode;

type ReasonCodeEntry = { readonly code: string; readonly label: string };

function toCodeSet(vocabulary: readonly ReasonCodeEntry[]): ReadonlySet<string> {
  return new Set(vocabulary.map((entry) => entry.code));
}

export const COMPANY_VERIFICATION_REASON_CODE_SET = toCodeSet(COMPANY_VERIFICATION_REASON_CODES);
export const JOB_POST_REASON_CODE_SET = toCodeSet(JOB_POST_REASON_CODES);
export const SEEKER_ID_REASON_CODE_SET = toCodeSet(SEEKER_ID_REASON_CODES);
