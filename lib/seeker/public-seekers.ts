import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { publicSeekerTag } from "@/lib/public-cache-tags";
import { reviveDates } from "@/lib/cache-utils";
import { signResumeUrl } from "@/lib/seeker/resume-urls";
import { verificationTier } from "@/lib/seeker/verification-score";

const PUBLIC_SEEKER_REVALIDATE_SECONDS = 30;

/** Drop the cached public profile for one seeker (call after any SeekerProfile row edit). */
export function invalidatePublicSeeker(seekerId: string) {
  revalidateTag(publicSeekerTag(seekerId), "max");
}

export async function getPublicSeeker(id: string) {
  const seeker = await unstable_cache(
    async () => {
      const result = await prisma.seekerProfile.findFirst({
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

      if (!result) {
        throw new ApiError("Profile not found", 404);
      }

      return { ...result, verificationTier: verificationTier(result.verificationScore) };
    },
    ["public-seeker", id],
    { revalidate: PUBLIC_SEEKER_REVALIDATE_SECONDS, tags: [publicSeekerTag(id)] }
  )();

  const revived = reviveDates(seeker);
  // Signed URLs are short-lived (300s TTL, see lib/seeker/resume-urls.ts) and
  // must never be cached — sign outside unstable_cache, same as
  // listIdentityDocuments in lib/seeker/identity-verification.ts.
  return {
    ...revived,
    resumeUrl: await signResumeUrl(revived.resumeUrl),
  };
}
