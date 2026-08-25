import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getCollaborativeReviewQueue } from "@/lib/collaborative-hiring-reviews";
import CollaboratorCandidateQueue from "@/components/hiring/CollaboratorCandidateQueue";

export default async function CollaborativeJobQueuePage({ params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  const session = await auth();
  const { companyId, jobId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/jobs/${jobId}`)}`);
  const queue = await getCollaborativeReviewQueue(companyId, session.user.id, jobId);
  return <CollaboratorCandidateQueue companyId={companyId} {...JSON.parse(JSON.stringify(queue))} />;
}
