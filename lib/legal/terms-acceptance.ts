import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { CURRENT_TERMS_VERSION } from "@/lib/legal/terms-version";

/**
 * Stamps the user's acceptance of the current Terms/Privacy. The client sends
 * the version it displayed; if the terms were bumped while that page was open,
 * reject rather than record consent to text the user never saw.
 */
export async function acceptCurrentTerms(userId: string, version: string) {
  if (version !== CURRENT_TERMS_VERSION) {
    throw new ApiError("The Terms have been updated. Please reload the page and review them again.", 409);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { termsAcceptedAt: new Date(), termsVersion: CURRENT_TERMS_VERSION },
  });

  return { version: CURRENT_TERMS_VERSION };
}
