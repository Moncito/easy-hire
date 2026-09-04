import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { signResumeUrl } from "@/lib/seeker/resume-urls";
import { verificationTier } from "@/lib/seeker/verification-score";

export async function getPublicSeeker(id: string) {
  const seeker = await prisma.seekerProfile.findFirst({
    where: { id, visibility: "PUBLIC" },
    select: {
      id: true,
      fullName: true,
      headline: true,
      bio: true,
      location: true,
      skills: true,
      availability: true,
      yearsExperience: true,
      desiredSalaryMin: true,
      desiredSalaryMax: true,
      linkedinUrl: true,
      portfolioUrl: true,
      certifications: true,
      languages: true,
      workExperience: true,
      education: true,
      timezone: true,
      photoUrl: true,
      resumeUrl: true,
      updatedAt: true,
      // Identity-confidence signals only — never the raw documents,
      // idVerificationRejectionReason, or idVerificationStatus itself (see
      // lib/seeker/verification-score.ts's doc comment: this is NOT a skill
      // measure).
      verificationScore: true,
      idVerifiedAt: true,
    },
  });

  if (!seeker) {
    throw new ApiError("Profile not found", 404);
  }

  return {
    ...seeker,
    resumeUrl: await signResumeUrl(seeker.resumeUrl),
    verificationTier: verificationTier(seeker.verificationScore),
  };
}
