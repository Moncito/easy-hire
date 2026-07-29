/**
 * Two-tier job classification.
 *
 * - INDUSTRIES: the business domain the role sits in (SEEK/Indeed-style
 *   industry taxonomy). Stored on `Job.industry`.
 * - ROLE_TYPES: the actual VA function being hired for. Stored on the
 *   existing `Job.category` column (kept as-is to avoid a disruptive
 *   rename across every place that already reads `job.category`).
 *
 * Both are plain label arrays (not Prisma enums) so the list can grow
 * without a migration — validation happens in the Zod schemas instead.
 */

export type JobCategoryOption = { label: string; slug: string };

function toSlug(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function build(labels: string[]): JobCategoryOption[] {
  return labels.map((label) => ({ label, slug: toSlug(label) }));
}

export const INDUSTRY_LABELS = [
  "Accounting",
  "Administration & Office Support",
  "Advertising, Arts & Media",
  "Banking & Financial Services",
  "Call Center & Customer Service",
  "CEO & General Management",
  "Community Services & Development",
  "Construction",
  "Consulting & Strategy",
  "Design & Architecture",
  "Education & Training",
  "Engineering",
  "Farming, Animals & Conservation",
  "Government & Defense",
  "Healthcare & Medical",
  "Hospitality & Tourism",
  "Human Resources & Recruitment",
  "Information & Communication Technology (ICT)",
  "Insurance & Superannuation",
  "Legal",
  "Manufacturing, Transport & Logistics",
  "Marketing & Communications",
  "Mining, Resources & Energy",
  "Real Estate & Property",
  "Retail & Consumer Products",
  "Sales",
  "Science & Technology",
  "Self Employment",
  "Sport & Recreation",
  "Trades & Services",
] as const;

export const ROLE_TYPE_LABELS = [
  "Virtual Assistant",
  "Executive Assistant",
  "General Virtual Assistant",
  "Customer Support",
  "Email Support",
  "Live Chat Support",
  "Technical Support",
  "Appointment Setter",
  "Cold Caller",
  "Lead Generation",
  "Sales Representative",
  "Account Manager",
  "Social Media Manager",
  "Community Manager",
  "Content Writer",
  "Copywriter",
  "SEO Specialist",
  "Digital Marketing",
  "PPC Specialist",
  "Graphic Designer",
  "Video Editor",
  "Motion Graphics",
  "Web Developer",
  "Mobile Developer",
  "Software Engineer",
  "UI/UX Designer",
  "QA Tester",
  "Data Entry",
  "Data Analyst",
  "Bookkeeping",
  "Payroll",
  "Recruitment",
  "HR Assistant",
  "Project Manager",
  "Operations Manager",
  "E-commerce (Amazon/Shopify)",
  "Shopify VA",
  "Amazon VA",
  "Healthcare VA",
  "Real Estate VA",
  "Legal VA",
  "Medical VA",
  "AI Prompt Engineer",
  "AI Automation Specialist",
  "Cybersecurity",
  "DevOps",
  "Cloud Engineer",
  "Other",
] as const;

export const INDUSTRIES: JobCategoryOption[] = build([...INDUSTRY_LABELS]);
export const ROLE_TYPES: JobCategoryOption[] = build([...ROLE_TYPE_LABELS]);

export const INDUSTRY_LABEL_SET = new Set<string>(INDUSTRY_LABELS);
export const ROLE_TYPE_LABEL_SET = new Set<string>(ROLE_TYPE_LABELS);
