import { requireEmployerPageContext } from "@/lib/employer-session";
import { getNewJobPrefill } from "@/lib/employer/hiring-defaults";
import { canAutoPublishJob } from "@/lib/billing/subscriptions";
import NewJobForm from "@/components/employer/NewJobForm";

export default async function NewJobPage() {
  const { company } = await requireEmployerPageContext();
  // Same check the server runs on submit (verified Employer Pro publishes
  // live; everyone else goes to admin review), so the form's wording matches.
  const [prefill, canPublishInstantly] = await Promise.all([
    getNewJobPrefill(company.id),
    canAutoPublishJob(company.id),
  ]);
  return <NewJobForm initialData={prefill} canPublishInstantly={canPublishInstantly} />;
}