import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { signResumeUrl } from "@/lib/seeker/resume-urls";

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
    },
  });

  if (!seeker) {
    throw new ApiError("Profile not found", 404);
  }

  return { ...seeker, resumeUrl: await signResumeUrl(seeker.resumeUrl) };
}
