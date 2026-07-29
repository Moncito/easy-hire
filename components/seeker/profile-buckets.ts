import type { EmployerPreviewData } from "@/components/seeker/SeekerEmployerPreview";
import {
  parseCertification,
  parseEducation,
  parseWorkExperience,
  skillName,
} from "@/lib/seeker-profile-format";

export type ProfileBucketId =
  | "summary"
  | "basics"
  | "resume"
  | "skills"
  | "career"
  | "education"
  | "next-role"
  | "languages"
  | "credentials"
  | "visibility";

export type ProfileBucket = {
  id: ProfileBucketId;
  label: string;
  description: string;
};

export const PROFILE_BUCKETS: ProfileBucket[] = [
  {
    id: "summary",
    label: "Personal summary",
    description: "Your headline and story — the first thing employers read.",
  },
  {
    id: "basics",
    label: "Contact & photo",
    description: "Name, location, phone, and a professional photo.",
  },
  {
    id: "resume",
    label: "Resume",
    description: "Up to 3 CVs — pick which one goes out when you apply.",
  },
  {
    id: "skills",
    label: "Skills & experience",
    description: "VA skills with proficiency and years of experience.",
  },
  {
    id: "career",
    label: "Career history",
    description: "Past roles — title, company, dates, and what you did.",
  },
  {
    id: "education",
    label: "Education",
    description: "School, degree, and graduation year.",
  },
  {
    id: "next-role",
    label: "About your next role",
    description: "Availability, timezone, and salary expectations in PHP.",
  },
  {
    id: "languages",
    label: "Languages",
    description: "Languages you speak and your proficiency level.",
  },
  {
    id: "credentials",
    label: "Links & certifications",
    description: "LinkedIn, portfolio, and credentials with issuer details.",
  },
  {
    id: "visibility",
    label: "Profile visibility",
    description: "Control who can discover you in talent search.",
  },
];

type BucketState = EmployerPreviewData & { resumeUrl: string | null; photoUrl: string | null };

export function isBucketComplete(id: ProfileBucketId, data: BucketState): boolean {
  switch (id) {
    case "summary":
      return !!data.headline?.trim() && !!data.bio?.trim();
    case "basics":
      return !!data.fullName.trim() && !!data.location?.trim() && !!data.photoUrl;
    case "resume":
      return !!data.resumeUrl;
    case "skills":
      return data.skills.length > 0 && !!data.yearsExperience;
    case "career":
      return data.workExperience.some((entry) => {
        const { title, company } = parseWorkExperience(entry);
        return !!title.trim() && !!company.trim();
      });
    case "education":
      return data.education.some((entry) => !!parseEducation(entry).school.trim());
    case "next-role":
      return (
        !!data.availability &&
        (data.desiredSalaryMin != null || data.desiredSalaryMax != null) &&
        !!data.timezone
      );
    case "languages":
      return data.languages.length > 0;
    case "credentials":
      return (
        !!data.linkedinUrl?.trim() ||
        !!data.portfolioUrl?.trim() ||
        data.certifications.some((c) => !!parseCertification(c).name.trim())
      );
    case "visibility":
      return data.visibility !== "HIDDEN";
    default:
      return false;
  }
}

export function profileBucketCompletion(data: BucketState) {
  const completed = PROFILE_BUCKETS.filter((b) => isBucketComplete(b.id, data)).length;
  return { completed, total: PROFILE_BUCKETS.length };
}

export function hasSkill(data: BucketState, skill: string): boolean {
  return data.skills.some((s) => skillName(s).toLowerCase() === skill.toLowerCase());
}
