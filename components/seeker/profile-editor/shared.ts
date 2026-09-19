import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";

export type FormData = {
  fullName: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  resumeLabel: string;
  resumeUpdatedAt: string | null;
  resumes: string[];
  linkedinUrl: string;
  portfolioUrl: string;
  certifications: string[];
  languages: string[];
  workExperience: string[];
  education: string[];
  timezone: string;
  photoUrl: string | null;
  visibility: ProfileVisibilityLevel;
};

export type UpdateField = <K extends keyof FormData>(key: K, value: FormData[K]) => void;

export const availabilityOptions = ["Full-time", "Part-time", "Project-based"];
export const experienceOptions = ["< 1 yr", "1-3 yrs", "3-5 yrs", "5+ yrs"];

// Underline style — no box, no fill — consistent with summaryHeadlineClassName
// / summaryBioClassName below. The box-focus treatment (border-on-all-sides +
// ring) doesn't read well on an unboxed field, so focus now moves the
// border-bottom color to marigold; the ring is kept (not dropped) purely as
// an accessibility signal for keyboard focus, sized down so it doesn't look
// like a box reappearing around the field.
export const inputClassName =
  "w-full border-0 border-b-[1.5px] border-ink/12 bg-transparent py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20 focus-visible:ring-offset-0";

export const selectClassName =
  "w-full cursor-pointer appearance-none border-0 border-b-[1.5px] border-ink/12 bg-transparent py-3 text-sm text-ink outline-none transition-colors focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20 focus-visible:ring-offset-0";

// Bordered-box style, distinct from inputClassName's underline treatment —
// scoped to SummaryBucket only (headline/bio are the "first thing employers
// read" fields the mockup singles out for a boxed, card-like look). The
// underline style stays the convention everywhere else in the editor.
export const summaryHeadlineClassName =
  "w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/15";

export const summaryBioClassName =
  "w-full rounded-lg border border-ink/15 bg-white px-3.5 py-3 text-sm leading-relaxed text-ink placeholder:text-ink/30 outline-none transition-colors focus:border-marigold focus:ring-2 focus:ring-marigold/15";
