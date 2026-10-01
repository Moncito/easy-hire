import { redirect } from "next/navigation";
import EditJobForm from "@/components/employer/EditJobForm";
import JobFormPageShell from "@/components/employer/JobFormPageShell";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { getEmployerJobForEdit } from "@/lib/employer-jobs";
import { canAutoPublishJob } from "@/lib/billing/subscriptions";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { company } = await requireEmployerPageContext();
  const { id } = await params;

  const [job, canPublishInstantly] = await Promise.all([
    getEmployerJobForEdit(company.id, id),
    canAutoPublishJob(company.id),
  ]);

  if (!job) {
    redirect("/employer/jobs");
  }

  return (
    <JobFormPageShell
      title="Edit job posting"
      description={
        job.status === "ACTIVE"
          ? canPublishInstantly
            ? "This job is live. Saving keeps it live — changes show to seekers right away."
            : "This job is currently live. Saving changes will send it back for review before it's visible again."
          : undefined
      }
    >
      <EditJobForm
        jobId={job.id}
        canPublishInstantly={canPublishInstantly}
        editingLiveJob={job.status === "ACTIVE"}
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
