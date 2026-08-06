import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApplicantsBoard from "@/components/employer/ApplicantsBoard";

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
    select: { id: true, verifiedStatus: true, companyName: true },
  });

  const job = company
    ? await prisma.job.findFirst({
        where: { id, companyId: company.id },
      })
    : null;

  if (!job) {
    redirect("/employer/jobs");
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
          resumeLabel: true,
          resumeUpdatedAt: true,
          resumes: true,
          location: true,
          desiredSalaryMin: true,
          desiredSalaryMax: true,
          availability: true,
          yearsExperience: true,
          languages: true,
          education: true,
        },
      },
      answers: {
        include: {
          question: { select: { id: true, prompt: true, required: true, sortOrder: true } },
        },
        orderBy: { question: { sortOrder: "asc" } },
      },
    },
  });

  const staleThreshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const unreviewedStale = applications.filter(
    (a) => a.status === "APPLIED" && a.appliedAt < staleThreshold
  ).length;
  const needsAttention = unreviewedStale > 0;
  const companyVerified = company?.verifiedStatus === "APPROVED";

  return (
    <ApplicantsBoard
      job={{
        id: job.id,
        title: job.title,
        status: job.status,
        employmentType: job.employmentType,
        remoteType: job.remoteType,
        location: job.location,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryPeriod: job.salaryPeriod,
        createdAt: job.createdAt.toISOString(),
        targetHireCount: job.targetHireCount,
      }}
      companyVerified={companyVerified}
      needsAttention={needsAttention}
      employerName={company?.companyName ?? "Team"}
      initialApplications={JSON.parse(JSON.stringify(applications))}
    />
  );
}
