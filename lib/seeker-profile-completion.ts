import {
  PROFILE_BUCKETS,
  isBucketComplete,
  profileBucketCompletion,
  type ProfileBucketId,
} from "@/components/seeker/profile-buckets";
import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";
import { normalizeSkillEntry } from "@/lib/seeker-profile-format";

export type SeekerProfileCompletionInput = {
  fullName: string;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  photoUrl?: string | null;
  resumeUrl?: string | null;
  skills?: string[];
  yearsExperience?: string | null;
  availability?: string | null;
  desiredSalaryMin?: number | null;
  desiredSalaryMax?: number | null;
  timezone?: string | null;
  languages?: string[];
  workExperience?: string[];
  education?: string[];
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  certifications?: string[];
  visibility?: ProfileVisibilityLevel | string;
};

export function toBucketCompletionState(profile: SeekerProfileCompletionInput) {
  return {
    fullName: profile.fullName ?? "",
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    skills: (profile.skills ?? []).map(normalizeSkillEntry),
    availability: profile.availability ?? null,
    yearsExperience: profile.yearsExperience ?? null,
    desiredSalaryMin: profile.desiredSalaryMin ?? null,
    desiredSalaryMax: profile.desiredSalaryMax ?? null,
    linkedinUrl: profile.linkedinUrl ?? null,
    portfolioUrl: profile.portfolioUrl ?? null,
    certifications: profile.certifications ?? [],
    languages: profile.languages ?? [],
    workExperience: profile.workExperience ?? [],
    education: profile.education ?? [],
    timezone: profile.timezone ?? null,
    photoUrl: profile.photoUrl ?? null,
    visibility: (profile.visibility ?? "STANDARD") as ProfileVisibilityLevel,
    resumeUrl: profile.resumeUrl ?? null,
  };
}

export function getSeekerProfileCompletion(profile: SeekerProfileCompletionInput) {
  return profileBucketCompletion(toBucketCompletionState(profile));
}

export function firstIncompleteBucket(profile: SeekerProfileCompletionInput): ProfileBucketId | null {
  const state = toBucketCompletionState(profile);
  const incomplete = PROFILE_BUCKETS.find((b) => !isBucketComplete(b.id, state));
  return incomplete?.id ?? null;
}
