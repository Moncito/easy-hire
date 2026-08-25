import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { getCollaborativeJobForEdit } from "@/lib/collaborative-job-management";
import CollaboratorJobForm from "@/components/hiring/CollaboratorJobForm";

export default async function EditCollaborativeJobPage({ params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  const session = await auth();
  const { companyId, jobId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/jobs/${jobId}/edit`)}`);
  const membership = await requireCompanyMembership(companyId, session.user.id, "jobs:manage");
  const job = await getCollaborativeJobForEdit(companyId, session.user.id, jobId);
  return (
    <CollaboratorJobForm
      companyId={companyId}
      role={membership.role}
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
        screeningQuestions: job.screeningQuestions.map((q) => ({ prompt: q.prompt, required: q.required })),
      }}
    />
  );
}
