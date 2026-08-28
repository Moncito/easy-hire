import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { invalidateCollaborativeCompanyBranding } from "@/lib/collaborative-company-profile";

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { industry, teamSize } = body;

  const updated = await prisma.company.update({
    where: { userId: session.user.id },
    data: {
      ...(industry !== undefined && { industry }),
      ...(teamSize !== undefined && { teamSize }),
    },
  });

  invalidateCollaborativeCompanyBranding(updated.id);
  return NextResponse.json({ id: updated.id });
}