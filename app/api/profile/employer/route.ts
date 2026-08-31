import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { invalidateCollaborativeCompanyBranding } from "@/lib/collaborative-company-profile";
import { invalidatePublicCompany } from "@/lib/public-companies";
import { employerOnboardingUpdateSchema } from "@/lib/validations/company";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseJsonBody(req);
    const { industry, teamSize } = employerOnboardingUpdateSchema.parse(body);

    const updated = await prisma.company.update({
      where: { userId: session.user.id },
      data: {
        ...(industry !== undefined && { industry }),
        ...(teamSize !== undefined && { teamSize }),
      },
    });

    invalidateCollaborativeCompanyBranding(updated.id);
    invalidatePublicCompany(updated.id);
    return NextResponse.json({ id: updated.id });
  } catch (error) {
    return errorResponse(error);
  }
}