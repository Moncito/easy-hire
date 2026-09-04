import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { seekerIdentityDocumentCreateSchema } from "@/lib/validations/verification";
import { VERIFICATION_DOC_BUCKET, assertOwnedObjectPath, resolveSignedUrl } from "@/lib/storage";
import { invalidateSeekerProfile } from "@/lib/seeker/seekers";
import { getSeekerProfileCompletion, type SeekerProfileCompletionInput } from "@/lib/seeker/profile-completion";
import { computeVerificationScore } from "@/lib/seeker/verification-score";
import type { SeekerIdentityDocument } from "@prisma/client";

export const MAX_IDENTITY_DOCUMENTS = 3;

/** Signs a seeker identity document's `fileUrl` for display (private bucket, short TTL) — mirrors signVerificationDocument in lib/employer/verification.ts. */
async function signIdentityDocument<T extends SeekerIdentityDocument>(document: T) {
  return { ...document, fileUrl: (await resolveSignedUrl(VERIFICATION_DOC_BUCKET, document.fileUrl)) ?? "" };
}

async function findSeekerProfileByUserId(userId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ApiError("Seeker profile not found", 404);
  }
  return profile;
}

/**
 * Recomputes and persists `verificationScore` for one seeker profile.
 * Cheap and idempotent — safe to call fire-and-forget after any mutation
 * that can move one of the four inputs (identity status, email
 * verification, profile completeness, confirmed hires).
 */
export async function recomputeVerificationScore(seekerProfileId: string): Promise<number | null> {
  const profile = await prisma.seekerProfile.findUnique({
    where: { id: seekerProfileId },
    select: {
      userId: true,
      idVerificationStatus: true,
      fullName: true,
      headline: true,
      bio: true,
      location: true,
      photoUrl: true,
      resumeUrl: true,
      skills: true,
      yearsExperience: true,
      availability: true,
      desiredSalaryMin: true,
      desiredSalaryMax: true,
      timezone: true,
      languages: true,
      workExperience: true,
      education: true,
      linkedinUrl: true,
      portfolioUrl: true,
      certifications: true,
      visibility: true,
      user: { select: { emailVerifiedAt: true } },
    },
  });

  if (!profile) return null;

  // Distinct companies that hired this seeker — Application.hiredAt is the
  // proof-of-relationship anchor (see prisma/schema.prisma's Application
  // model comment), not `status === "HIRED"` alone, since status can move
  // again after a hire while hiredAt stays stamped.
  const hires = await prisma.application.findMany({
    where: { seekerId: seekerProfileId, hiredAt: { not: null } },
    select: { job: { select: { companyId: true } } },
  });
  const confirmedHireCount = new Set(hires.map((h) => h.job.companyId)).size;

  const { completed, total } = getSeekerProfileCompletion(profile as SeekerProfileCompletionInput);
  const profileCompletionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { score } = computeVerificationScore({
    idVerificationStatus: profile.idVerificationStatus,
    emailVerifiedAt: profile.user.emailVerifiedAt,
    profileCompletionPercent,
    confirmedHireCount,
  });

  await prisma.seekerProfile.update({
    where: { id: seekerProfileId },
    data: { verificationScore: score, verificationScoreUpdatedAt: new Date() },
  });

  invalidateSeekerProfile(profile.userId);
  // No separate "public seeker" cache tag exists in this codebase today —
  // app/seekers/[id]/page.tsx calls getPublicSeeker() uncached (no
  // unstable_cache/cacheTag wrapper) — so invalidateSeekerProfile above is
  // the only tag to drop. Revisit this comment if that page is later cached.

  return score;
}

/** Convenience wrapper for callers that only have a userId (e.g. email verification, which fires for both seeker and employer accounts). No-ops silently for non-seeker users. */
export async function recomputeVerificationScoreForUser(userId: string): Promise<number | null> {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId }, select: { id: true } });
  if (!profile) return null;
  return recomputeVerificationScore(profile.id);
}

export async function listIdentityDocuments(userId: string) {
  const profile = await findSeekerProfileByUserId(userId);

  const documents = await prisma.seekerIdentityDocument.findMany({
    where: { seekerProfileId: profile.id },
    orderBy: { uploadedAt: "desc" },
  });

  return Promise.all(documents.map(signIdentityDocument));
}

export async function createIdentityDocument(userId: string, raw: unknown) {
  const input = seekerIdentityDocumentCreateSchema.parse(raw);
  const profile = await findSeekerProfileByUserId(userId);

  const fileUrl = assertOwnedObjectPath(VERIFICATION_DOC_BUCKET, input.fileUrl, [`identity/${userId}/`]);

  const docCount = await prisma.seekerIdentityDocument.count({ where: { seekerProfileId: profile.id } });
  if (docCount >= MAX_IDENTITY_DOCUMENTS) {
    throw new ApiError(`You can upload up to ${MAX_IDENTITY_DOCUMENTS} documents`, 400);
  }

  // Mirrors the wasRejected transaction in lib/employer/verification.ts's
  // createVerificationDocument: uploading a fresh document after a
  // rejection auto-resubmits for review. A first-ever upload (status still
  // null) does NOT auto-submit — that's the explicit requestIdentityReview
  // step below, since (unlike Company.verifiedStatus) a seeker's identity
  // status starts null, not PENDING.
  const wasRejected = profile.idVerificationStatus === "REJECTED";

  const [document] = await prisma.$transaction([
    prisma.seekerIdentityDocument.create({
      data: {
        seekerProfileId: profile.id,
        fileUrl,
        fileName: input.fileName,
        docType: input.docType,
      },
    }),
    ...(wasRejected
      ? [
          prisma.seekerProfile.update({
            where: { id: profile.id },
            data: { idVerificationStatus: "PENDING" as const, idVerificationRejectionReason: null },
          }),
        ]
      : []),
  ]);

  if (wasRejected) {
    void recomputeVerificationScore(profile.id).catch((err) =>
      console.error("[identity-verification] score recompute after resubmit failed:", err)
    );
  }

  return signIdentityDocument(document);
}

export async function deleteIdentityDocument(userId: string, documentId: string) {
  const profile = await findSeekerProfileByUserId(userId);

  if (profile.idVerificationStatus === "APPROVED") {
    throw new ApiError("Documents can't be removed once your identity is verified", 400);
  }

  const document = await prisma.seekerIdentityDocument.findFirst({
    where: { id: documentId, seekerProfileId: profile.id },
  });

  if (!document) {
    throw new ApiError("Document not found", 404);
  }

  await prisma.seekerIdentityDocument.delete({ where: { id: documentId } });
  return document;
}

export async function requestIdentityReview(userId: string) {
  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    include: { _count: { select: { identityDocuments: true } } },
  });

  if (!profile) {
    throw new ApiError("Seeker profile not found", 404);
  }

  if (profile.idVerificationStatus === "APPROVED") {
    throw new ApiError("Your identity is already verified", 400);
  }

  if (profile._count.identityDocuments === 0) {
    throw new ApiError("Upload at least one identity document before requesting review", 400);
  }

  const updated = await prisma.seekerProfile.update({
    where: { id: profile.id },
    data: { idVerificationStatus: "PENDING", idVerificationRejectionReason: null },
  });

  void recomputeVerificationScore(profile.id).catch((err) =>
    console.error("[identity-verification] score recompute after review request failed:", err)
  );

  return updated;
}
