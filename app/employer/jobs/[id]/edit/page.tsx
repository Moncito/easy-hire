import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EditJobForm from "@/components/employer/EditJobForm";
import JobFormPageShell from "@/components/employer/JobFormPageShell";

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  const job = company
    ? await prisma.job.findFirst({
        where: { id: params.id, companyId: company.id },
      })
    : null;

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
          employmentType: job.employmentType,
          salaryMin: job.salaryMin?.toString() || "",
          salaryMax: job.salaryMax?.toString() || "",
          location: job.location,
          remoteType: job.remoteType,
        }}
      />
    </JobFormPageShell>
  );
}
