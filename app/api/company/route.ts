import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany, requireEmployerJob } from "@/lib/employer-auth";
import { updateCompany } from "@/lib/companies";
import { invalidateCollaborativeCompanyBranding } from "@/lib/collaborative-company-profile";
import { invalidatePublicCompany } from "@/lib/public-companies";
import { ZodError } from "zod";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireEmployerCompany(session.user.id);
    const body = await req.json();
    const updated = await updateCompany(session.user.id, body);
    invalidateCollaborativeCompanyBranding(updated.id);
    invalidatePublicCompany(updated.id);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(error);
  }
}
