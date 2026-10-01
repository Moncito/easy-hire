// Deterministic checks for job-post language that breaks our Job Posting
// Guidelines (app/job-posting-guidelines) — chiefly the Philippine
// anti-discrimination rules (RA 10911 age, RA 9710 sex/gender, RA 7277
// disability) and the "never charge applicants" rule.
//
// Pure and dependency-free so it runs in the employer form (live warnings),
// in /lib/jobs/crud.ts (a flagged post from an auto-publish company goes to
// human review instead), and in the admin review pane. It is a FLAG, never a
// rejection: patterns are deliberately narrow to keep false positives low,
// and a person always makes the call.

export type ComplianceIssueCode =
  | "AGE_REQUIREMENT"
  | "GENDER_REQUIREMENT"
  | "CIVIL_STATUS"
  | "APPEARANCE"
  | "APPLICANT_FEE"
  | "SENSITIVE_DATA";

export type ComplianceIssue = {
  code: ComplianceIssueCode;
  /** Short, employer-facing explanation. */
  message: string;
  /** The matched text with a little surrounding context. */
  excerpt: string;
  /** Deep link into the guidelines page. */
  guidelineHref: string;
};

export type PostingText = {
  title?: string | null;
  description?: string | null;
  requirements?: string | null;
  benefits?: string | null;
  /** Anything else employer-written, e.g. screening question prompts. */
  extra?: (string | null | undefined)[];
};

type Rule = {
  code: ComplianceIssueCode;
  message: string;
  guidelineHref: string;
  patterns: RegExp[];
};

const FAIR = "/job-posting-guidelines#fair-hiring";
const NOT_ALLOWED = "/job-posting-guidelines#not-allowed";

// Single minimum ages ("at least 18 years old") are intentionally NOT
// flagged — that's the legal working age, not a preference. Experience
// ranges ("3-5 years of experience") never match: every age pattern needs
// "age", "old", or "y/o".
const RULES: Rule[] = [
  {
    code: "AGE_REQUIREMENT",
    message: "Age ranges or upper age limits aren't allowed (RA 10911). Describe the skills or availability you need instead.",
    guidelineHref: FAIR,
    patterns: [
      /\bage(?:d|s)?\s*(?:is|of|:|-)?\s*(?:between\s*)?\d{2}\s*(?:-|–|—|to|and)\s*\d{2}\b/i,
      /\b\d{2}\s*(?:-|–|—|to)\s*\d{2}\s*(?:years?|yrs?)\s*old\b/i,
      /\b\d{2}\s*(?:years?|yrs?)\s*old\s*(?:and\s*)?(?:below|under|or\s+(?:younger|below|less))\b/i,
      /\b(?:below|under|not\s+older\s+than|no\s+older\s+than|younger\s+than)\s*\d{2}\s*(?:years?|yrs?)\s*old\b/i,
      /\b\d{2}\s*(?:y\/o|yo|yrs?\s*\/\s*o)\b/i,
      /\b(?:max(?:imum)?\.?\s*age|age\s*limit|age\s*requirement)\b/i,
      /\byoung(?:er)?\s+(?:applicants?|candidates?|people|professionals?|team\s+members?)\b/i,
    ],
  },
  {
    code: "GENDER_REQUIREMENT",
    message: "Sex or gender requirements aren't allowed unless the job genuinely requires them (RA 9710).",
    guidelineHref: FAIR,
    patterns: [
      /\b(?:female|male|women|men|ladies|gentlemen)\s+(?:(?:applicants?|candidates?)\s+)?(?:only|(?:are\s+)?preferred)\b/i,
      /\b(?:preferably|prefer(?:red)?|must\s+be)\s+(?:a\s+)?(?:female|male|woman|man|lady)\b/i,
      /\bgender\s*:\s*(?:female|male)\b/i,
    ],
  },
  {
    code: "CIVIL_STATUS",
    message: "Don't ask about civil status or children — describe the hours and availability you need instead.",
    guidelineHref: FAIR,
    patterns: [
      /\b(?:single|unmarried|married)\s+(?:only|preferred|applicants?|candidates?)\b/i,
      /\bmust\s+be\s+(?:single|married|unmarried)\b/i,
      /\b(?:no|without)\s+(?:kids|children)\b/i,
      /\bcivil\s+status\b/i,
    ],
  },
  {
    code: "APPEARANCE",
    message: "Appearance, height, or photo requirements aren't relevant to remote work and can be discriminatory.",
    guidelineHref: FAIR,
    patterns: [
      /\bpleasing\s+personality\b/i,
      /\b(?:good[-\s]looking|attractive\s+(?:applicants?|candidates?|appearance))\b/i,
      /\b(?:height|weight)\s*(?::|of\s+at\s+least|at\s+least|must\s+be)\s*\d/i,
      /\b(?:attach|send|include|submit)\s+(?:a\s+|your\s+)?(?:recent\s+|full[-\s]body\s+|whole[-\s]body\s+)?(?:photo|picture|selfie|2x2)\b/i,
    ],
  },
  {
    code: "APPLICANT_FEE",
    message: "Applicants can never be charged — no application, training, kit, equipment, or deposit fees.",
    guidelineHref: NOT_ALLOWED,
    patterns: [
      /\b(?:registration|application|processing|training|placement|membership|onboarding|reservation)\s+(?:fees?|payments?|costs?)\b/i,
      /\bstarter\s+(?:kit|pack|package)\b/i,
      /\b(?:pay|deposit|send|invest)\s+(?:a\s+|an\s+|the\s+)?(?:fee\s+of\s+)?(?:₱|php\s?|p(?=\d)|\$|usd\s?)\s?\d/i,
      /\b(?:refundable|security)\s+deposit\b/i,
    ],
  },
  {
    code: "SENSITIVE_DATA",
    message: "Don't ask for government ID numbers, bank or e-wallet details, passwords, or OTPs in a job post.",
    guidelineHref: NOT_ALLOWED,
    patterns: [
      /\b(?:sss|tin|philhealth|pag-?ibig|passport|umid|national\s+id|driver'?s\s+licen[cs]e)\s*(?:number|no\b\.?|#)/i,
      /\b(?:bank\s+account|gcash|maya|paymaya|e-?wallet|credit\s+card|debit\s+card)\s+(?:number|details|login|password|pin)\b/i,
      /\b(?:otp|one[-\s]time\s+(?:password|pin|code))\b/i,
    ],
  },
];

const EXCERPT_RADIUS = 30;

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - EXCERPT_RADIUS);
  const end = Math.min(text.length, index + length + EXCERPT_RADIUS);
  const body = text.slice(start, end).replace(/\s+/g, " ").trim();
  return `${start > 0 ? "…" : ""}${body}${end < text.length ? "…" : ""}`;
}

/** One issue per rule (the first match), in rule order. */
export function checkPostingCompliance(post: PostingText): ComplianceIssue[] {
  const text = [post.title, post.description, post.requirements, post.benefits, ...(post.extra ?? [])]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");
  if (!text) return [];

  const issues: ComplianceIssue[] = [];
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = pattern.exec(text);
      if (match) {
        issues.push({
          code: rule.code,
          message: rule.message,
          excerpt: excerptAround(text, match.index, match[0].length),
          guidelineHref: rule.guidelineHref,
        });
        break;
      }
    }
  }
  return issues;
}
