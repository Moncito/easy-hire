import { requireEmployerPageContext } from "@/lib/employer-session";
import { getNewJobPrefill } from "@/lib/employer/hiring-defaults";
import NewJobForm from "@/components/employer/NewJobForm";

export default async function NewJobPage() {
  const { company } = await requireEmployerPageContext();
  const prefill = await getNewJobPrefill(company.id);
  return <NewJobForm initialData={prefill} />;
}
