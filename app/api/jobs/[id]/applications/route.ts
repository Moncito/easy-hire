import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: { id, companyId: company.id },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const applications = await prisma.application.findMany({
    where: { jobId: job.id },
    orderBy: { appliedAt: "desc" },
    include: {
      seeker: {
        select: {
          id: true,
          fullName: true,
          headline: true,
          skills: true,
          resumeUrl: true,
          linkedinUrl: true,
          portfolioUrl: true,
          certifications: true,
          photoUrl: true,
        },
      },
    },
  });

  return NextResponse.json(applications);
}