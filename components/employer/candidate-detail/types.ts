export type CandidateApplication = {
  id: string;
  status: string;
  coverNote: string | null;
  internalNotes: string | null;
  rating: number | null;
  appliedAt: string;
  updatedAt: string;
  seeker: {
    id: string;
    fullName: string;
    headline: string | null;
    photoUrl: string | null;
    skills: string[];
    resumeUrl: string | null;
    resumeLabel: string | null;
    resumeUpdatedAt: string | null;
    resumes: string[];
    location: string | null;
    desiredSalaryMin: number | null;
    desiredSalaryMax: number | null;
    availability: string | null;
    yearsExperience: string | null;
    languages: string[];
    education: string[];
  };
  answers?: {
    id: string;
    answerText: string;
    question: { id: string; prompt: string; required: boolean; sortOrder: number };
  }[];
};

export type CandidateDetailTab = "overview" | "application" | "notes";

export const PIPELINE = [
  { value: "APPLIED", label: "Applied" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "HIRED", label: "Hired" },
] as const;
