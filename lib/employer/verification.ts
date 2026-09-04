import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { verificationDocumentCreateSchema } from "@/lib/validations/verification";
import { VERIFICATION_DOC_BUCKET, assertOwnedObjectPath, resolveSignedUrl } from "@/lib/storage";
import type { VerificationDocument } from "@prisma/client";

export const MAX_VERIFICATION_DOCUMENTS = 5;

type CompanyProfileFields = {
  companyName: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  headquarters: string | null;
};

/**
 * A company can request re-review with a complete profile even without a
 * document if the rejection was about profile details rather than paperwork.
 */
function isCompanyProfileComplete(company: CompanyProfileFields) {
  return Boolean(
    company.companyName?.trim() &&
      company.description?.trim() &&
      company.industry?.trim() &&
      company.website?.trim() &&
      company.headquarters?.trim()
  );
}

/** Signs a verification document's `fileUrl` for display (private bucket, short TTL). */
async function signVerificationDocument<T extends VerificationDocument>(document: T) {
  return { ...document, fileUrl: (await resolveSignedUrl(VERIFICATION_DOC_BUCKET, document.fileUrl)) ?? "" };
}

export async function listVerificationDocuments(companyId: string) {
  const documents = await prisma.verificationDocument.findMany({
    where: { companyId },
    orderBy: { uploadedAt: "desc" },
  });

  return Promise.all(documents.map(signVerificationDocument));
}

export async function createVerificationDocument(companyId: string, raw: unknown) {
  const input = verificationDocumentCreateSchema.parse(raw);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  const fileUrl = assertOwnedObjectPath(VERIFICATION_DOC_BUCKET, input.fileUrl, [`${company.userId}/`]);

  const docCount = await prisma.verificationDocument.count({ where: { companyId } });
  if (docCount >= MAX_VERIFICATION_DOCUMENTS) {
    throw new ApiError(`You can upload up to ${MAX_VERIFICATION_DOCUMENTS} documents`, 400);
  }

  const wasRejected = company.verifiedStatus === "REJECTED";

  const [document] = await prisma.$transaction([
    prisma.verificationDocument.create({
      data: {
        companyId,
        fileUrl,
        fileName: input.fileName,
        docType: input.docType,
      },
    }),
    ...(wasRejected
      ? [
          prisma.company.update({
            where: { id: companyId },
            data: { verifiedStatus: "PENDING" as const, verificationRejectionReason: null },
          }),
        ]
      : []),
  ]);

  return signVerificationDocument(document);
}

export async function deleteVerificationDocument(companyId: string, documentId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  if (company.verifiedStatus === "APPROVED") {
    throw new ApiError("Documents can't be removed once your company is verified", 400);
  }

  const document = await prisma.verificationDocument.findFirst({
    where: { id: documentId, companyId },
  });

  if (!document) {
    throw new ApiError("Document not found", 404);
  }

  await prisma.verificationDocument.delete({ where: { id: documentId } });
  return document;
}

export async function requestVerificationReview(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { _count: { select: { verificationDocuments: true } } },
  });

  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  if (company.verifiedStatus !== "REJECTED") {
    throw new ApiError("Only a rejected company can request re-review", 400);
  }

  const hasDocuments = company._count.verificationDocuments > 0;
  const profileComplete = isCompanyProfileComplete(company);

  if (!hasDocuments && !profileComplete) {
    throw new ApiError(
      "Upload a verification document or complete your company profile before requesting review",
      400
    );
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { verifiedStatus: "PENDING", verificationRejectionReason: null },
  });
}
