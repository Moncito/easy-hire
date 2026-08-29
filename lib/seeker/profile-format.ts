export type StructuredCertification = {
  name: string;
  issuer: string;
  year: string;
};

export type StructuredLanguage = {
  language: string;
  proficiency: string;
};

export type StructuredWorkExperience = {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type StructuredEducation = {
  school: string;
  degree: string;
  field: string;
  year: string;
};

export type StructuredSkill = {
  skill: string;
  proficiency: string;
};

export type StructuredResume = {
  label: string;
  url: string;
  updatedAt: string;
};

export const MAX_RESUMES = 3;

export const SKILL_PROFICIENCY_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Proficient",
  "Advanced",
  "Expert",
] as const;

export const LANGUAGE_PRESETS = [
  "English",
  "Tagalog",
  "Cebuano",
  "Ilocano",
  "Hiligaynon",
  "Spanish",
  "Mandarin",
  "Japanese",
  "Korean",
] as const;

/** @deprecated use LANGUAGE_PRESETS */
export const LANGUAGE_OPTIONS = LANGUAGE_PRESETS;

export const SKILL_PRESETS = [
  "Admin",
  "Social Media",
  "Customer Service",
  "Tech/IT",
  "Content Writing",
  "Bookkeeping",
] as const;

export const PROFICIENCY_OPTIONS = ["Basic", "Conversational", "Fluent", "Native"] as const;

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Manila", label: "Philippines (PHT)" },
  { value: "America/New_York", label: "US Eastern (ET)" },
  { value: "America/Chicago", label: "US Central (CT)" },
  { value: "America/Denver", label: "US Mountain (MT)" },
  { value: "America/Los_Angeles", label: "US Pacific (PT)" },
  { value: "Europe/London", label: "UK (GMT/BST)" },
  { value: "Australia/Sydney", label: "Australia Eastern (AEST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
] as const;

export const VISIBILITY_OPTIONS = [
  {
    value: "HIDDEN" as const,
    label: "Hidden",
    description: "Not shown in talent search. Employers still see you when you apply.",
  },
  {
    value: "STANDARD" as const,
    label: "Standard",
    description: "Visible to verified employers in talent search.",
  },
  {
    value: "PUBLIC" as const,
    label: "Public",
    description: "Maximum visibility in talent search — recommended for active job seekers.",
  },
];

export function formatCertification(cert: StructuredCertification): string {
  return [cert.name.trim(), cert.issuer.trim(), cert.year.trim()].join("|");
}

export function parseCertification(raw: string): StructuredCertification {
  const [name = "", issuer = "", year = ""] = raw.split("|");
  return { name, issuer, year };
}

export function formatLanguage(lang: StructuredLanguage): string {
  return `${lang.language.trim()}|${lang.proficiency.trim()}`;
}

export function parseLanguage(raw: string): StructuredLanguage {
  const [language = "", proficiency = ""] = raw.split("|");
  return { language, proficiency };
}

export function displayCertification(raw: string): string {
  const { name, issuer, year } = parseCertification(raw);
  if (issuer && year) return `${name} · ${issuer} · ${year}`;
  if (issuer) return `${name} · ${issuer}`;
  return name || raw;
}

export function displayLanguage(raw: string): string {
  const { language, proficiency } = parseLanguage(raw);
  if (language && proficiency) return `${language} (${proficiency})`;
  return language || raw;
}

export function formatWorkExperience(entry: StructuredWorkExperience): string {
  return [
    entry.title.trim(),
    entry.company.trim(),
    entry.startDate.trim(),
    entry.endDate.trim(),
    entry.description.trim(),
  ].join("|");
}

export function parseWorkExperience(raw: string): StructuredWorkExperience {
  const [title = "", company = "", startDate = "", endDate = "", description = ""] = raw.split("|");
  return { title, company, startDate, endDate, description };
}

export function displayWorkExperience(raw: string): string {
  const { title, company, startDate, endDate } = parseWorkExperience(raw);
  const dates = [startDate, endDate].filter(Boolean).join(" – ");
  const base = company ? `${title} at ${company}` : title;
  return dates ? `${base} · ${dates}` : base || raw;
}

export function formatEducation(entry: StructuredEducation): string {
  return [entry.school.trim(), entry.degree.trim(), entry.field.trim(), entry.year.trim()].join("|");
}

export function parseEducation(raw: string): StructuredEducation {
  const [school = "", degree = "", field = "", year = ""] = raw.split("|");
  return { school, degree, field, year };
}

export function displayEducation(raw: string): string {
  const { school, degree, field, year } = parseEducation(raw);
  const parts = [degree, field].filter(Boolean).join(", ");
  const schoolPart = parts ? `${parts} — ${school}` : school;
  return year ? `${schoolPart} · ${year}` : schoolPart || raw;
}

/**
 * Extracts a plausible file extension from a filename/label — NOT a URL.
 * Use this for signed URLs (which contain JWT tokens with literal `.`
 * characters) where naive `url.split(".").pop()` yields garbage. Strips any
 * query string defensively, then requires a short alphanumeric trailing
 * segment (<= 5 chars) so labels like "Juan A. Cruz Resume" don't produce a
 * false extension.
 */
export function fileExtensionFromLabel(label: string): string | null {
  const withoutQuery = label.split("?")[0]?.trim() ?? "";
  const match = /\.([A-Za-z0-9]{1,5})$/.exec(withoutQuery);
  return match ? match[1].toUpperCase() : null;
}

export function resumeFilenameFromUrl(url: string): string {
  try {
    const segment = url.split("/").pop()?.split("?")[0] ?? "Resume";
    return decodeURIComponent(segment.replace(/^\d+-/, ""));
  } catch {
    return "Resume";
  }
}

export function isPdfResumeUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

export function formatRelativeUpdated(iso: string | Date | null | undefined): string {
  if (!iso) return "Never";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export function timezoneLabel(value: string | null | undefined): string {
  if (!value) return "Philippines (PHT)";
  return TIMEZONE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

export function isDiscoverableInTalentSearch(visibility: string): boolean {
  return visibility === "STANDARD" || visibility === "PUBLIC";
}

export function normalizeSkillEntry(raw: string): string {
  if (raw.includes("|")) return raw;
  return formatSkill({ skill: raw.trim(), proficiency: "Proficient" });
}

export function formatSkill(entry: StructuredSkill): string {
  return `${entry.skill.trim()}|${entry.proficiency.trim() || "Proficient"}`;
}

export function parseSkill(raw: string): StructuredSkill {
  const [skill = "", proficiency = "Proficient"] = raw.split("|");
  return { skill, proficiency: proficiency || "Proficient" };
}

export function displaySkill(raw: string): string {
  const { skill, proficiency } = parseSkill(normalizeSkillEntry(raw));
  if (skill && proficiency) return `${skill} (${proficiency})`;
  return skill || raw;
}

export function skillName(raw: string): string {
  return parseSkill(normalizeSkillEntry(raw)).skill;
}

export function skillMatchesStored(stored: string, query: string): boolean {
  return skillName(stored).toLowerCase() === query.toLowerCase();
}

export function encodedSkillVariants(skill: string): string[] {
  return SKILL_PROFICIENCY_OPTIONS.map((p) => formatSkill({ skill, proficiency: p }));
}

export function formatResume(entry: StructuredResume): string {
  return [entry.label.trim(), entry.url.trim(), entry.updatedAt.trim()].join("|");
}

export function parseResume(raw: string): StructuredResume {
  const [label = "", url = "", updatedAt = ""] = raw.split("|");
  return { label, url, updatedAt };
}

export function primaryFromResumes(
  resumes: string[],
  resumeUrl: string | null | undefined
): StructuredResume | null {
  if (!resumeUrl) return null;
  const match = resumes.find((r) => parseResume(r).url === resumeUrl);
  if (match) return parseResume(match);
  return {
    label: resumeFilenameFromUrl(resumeUrl),
    url: resumeUrl,
    updatedAt: "",
  };
}
