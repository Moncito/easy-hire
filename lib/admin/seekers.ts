import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { adminSeekerVerificationReviewSchema } from "@/lib/validations/admin";
import { VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";
import { recomputeVerificationScore } from "@/lib/seeker/identity-verification";

const PENDING_SEEKER_VERIFICATIONS_LIMIT = 100;

export async function listPendingSeekerVerifications() {
  const profiles = await prisma.seekerProfile.findMany({
    where: { idVerificationStatus: "PENDING" },
    orderBy: { updatedAt: "asc" },
    take: PENDING_SEEKER_VERIFICATIONS_LIMIT,
    select: {
      id: true,
      fullName: true,
      verificationScore: true,
      updatedAt: true,
      user: { select: { email: true } },
      identityDocuments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  // Admin review queue renders each document's fileUrl as a direct link —
  // sign them all up front, batched (never sequentially) across profiles.
  // Mirrors lib/admin/companies.ts's listPendingCompanies.
  return Promise.all(
    profiles.map(async (profile) => ({
      ...profile,
      identityDocuments: await Promise.all(
        profile.identityDocuments.map(async (doc) => ({
          ...doc,
          fileUrl: (await resolveSignedUrl(VERIFICATION_DOC_BUCKET, doc.fileUrl)) ?? "",
        }))
      ),
    }))
  );
}

export async function reviewSeekerVerification(seekerProfileId: string, raw: unknown) {
  const input = adminSeekerVerificationReviewSchema.parse(raw);

  const profile = await prisma.seekerProfile.findUnique({
    where: { id: seekerProfileId },
    include: { user: { select: { id: true } } },
  });

  if (!profile) {
    throw new ApiError("Seeker profile not found", 404);
  }

  if (profile.idVerificationStatus !== "PENDING") {
    throw new ApiError("Only seekers pending review can be approved or rejected", 400);
  }

  if (input.action === "approve") {
    const [updated] = await prisma.$transaction([
      prisma.seekerProfile.update({
        where: { id: seekerProfileId },
        data: {
          idVerificationStatus: "APPROVED",
          idVerifiedAt: new Date(),
          idVerificationRejectionReason: null,
        },
      }),
      prisma.notification.create({
        data: {
          userId: profile.user.id,
          type: "SEEKER_ID_APPROVED",
          message: `Your identity is verified. This raises your verification score and is visible to employers.`,
        },
      }),
    ]);

    await recomputeVerificationScore(seekerProfileId);
    return updated;
  }

  const reason = input.reason?.trim() || "Please review your submitted document(s) and try again.";

  const [updated] = await prisma.$transaction([
    prisma.seekerProfile.update({
      where: { id: seekerProfileId },
      data: { idVerificationStatus: "REJECTED", idVerificationRejectionReason: reason },
    }),
    prisma.notification.create({
      data: {
        userId: profile.user.id,
        type: "SEEKER_ID_REJECTED",
        message: `Your identity verification was not approved: ${reason}`,
      },
    }),
  ]);

  await recomputeVerificationScore(seekerProfileId);
  return updated;
}
