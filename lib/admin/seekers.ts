import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { adminSeekerVerificationReviewSchema } from "@/lib/validations/admin";
import { VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";
import { recomputeVerificationScore } from "@/lib/seeker/identity-verification";
import { buildAdminActionOperation } from "@/lib/admin/audit";
import { requireAdminPermission } from "@/lib/admin/permissions";

const PENDING_SEEKER_VERIFICATIONS_LIMIT = 100;

/** Gated on `document.view` — same reasoning as listPendingCompanies in lib/admin/companies.ts: this list embeds every pending seeker's signed ID-document URLs directly. */
export async function listPendingSeekerVerifications(adminUserId: string) {
  await requireAdminPermission(adminUserId, "document.view");

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

export async function reviewSeekerVerification(adminUserId: string, seekerProfileId: string, raw: unknown) {
  // Gated here, not only at the route (§8.1) — also the dispatch target for
  // lib/admin/bulk.ts's bulkReviewQueueItems.
  await requireAdminPermission(adminUserId, "queue.decide");

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
      buildAdminActionOperation({
        adminUserId,
        action: "SEEKER_VERIFICATION_APPROVE",
        targetType: "SEEKER_PROFILE",
        targetId: seekerProfileId,
        before: { idVerificationStatus: "PENDING" },
        after: { idVerificationStatus: "APPROVED" },
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
    buildAdminActionOperation({
      adminUserId,
      action: "SEEKER_VERIFICATION_REJECT",
      targetType: "SEEKER_PROFILE",
      targetId: seekerProfileId,
      reasonCode: input.reasonCode,
      note: reason,
      before: { idVerificationStatus: "PENDING" },
      after: { idVerificationStatus: "REJECTED" },
    }),
  ]);

  await recomputeVerificationScore(seekerProfileId);

  return updated;
}
