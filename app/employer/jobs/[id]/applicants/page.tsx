import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApplicantsBoard from "@/components/employer/ApplicantsBoard";
import ApplicantsJobHeader from "@/components/employer/ApplicantsJobHeader";

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
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
          location: true,
          desiredSalaryMin: true,
          desiredSalaryMax: true,
        },
      },
    },
  });

  const pipeline = {
    applied: applications.filter((a) => a.status === "APPLIED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    interview: applications.filter((a) => a.status === "INTERVIEW").length,
    hired: applications.filter((a) => a.status === "HIRED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <>
      <ApplicantsJobHeader
        job={{
          id: job.id,
          title: job.title,
          status: job.status,
          employmentType: job.employmentType,
          remoteType: job.remoteType,
          location: job.location,
          createdAt: job.createdAt.toISOString(),
        }}
        totalApplicants={applications.length}
        pipeline={pipeline}
      />
      <ApplicantsBoard
        job={{ id: job.id, status: job.status }}
        initialApplications={JSON.parse(JSON.stringify(applications))}
      />
    </>
  );
}
