import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "SEEKER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { skills, availability, yearsExperience } = body;

  const updated = await prisma.seekerProfile.update({
    where: { userId: session.user.id },
    data: {
      ...(skills !== undefined && { skills }),
      ...(availability !== undefined && { availability }),
      ...(yearsExperience !== undefined && { yearsExperience }),
    },
  });

  return NextResponse.json({ id: updated.id });
}