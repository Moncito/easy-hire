import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditJobForm from "@/components/employer/EditJobForm";
import JobFormPageShell from "@/components/employer/JobFormPageShell";
import { requireEmployerPageContext } from "@/lib/employer-session";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { company } = await requireEmployerPageContext();
  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: { id, companyId: company.id },
    include: {
      screeningQuestions: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!job) {
    redirect("/employer/jobs");
  }

  return (
    <JobFormPageShell
      title="Edit job posting"
      description={
        job.status === "ACTIVE"
          ? "This job is currently live. Saving changes will send it back for review before it's visible again."
          : undefined
      }
    >
      <EditJobForm
        jobId={job.id}
        initialData={{
          title: job.title,
          description: job.description,
          requirements: job.requirements ?? "",
          benefits: job.benefits ?? "",
          category: job.category,
          industry: job.industry ?? "",
          employmentType: job.employmentType,
          salaryMin: job.salaryMin?.toString() || "",
          salaryMax: job.salaryMax?.toString() || "",
          salaryPeriod: job.salaryPeriod,
          location: job.location,
          remoteType: job.remoteType,
          targetHireCount: job.targetHireCount.toString(),
          screeningQuestions: job.screeningQuestions.map((q) => ({
            prompt: q.prompt,
            required: q.required,
          })),
        }}
      />
    </JobFormPageShell>
  );
}
