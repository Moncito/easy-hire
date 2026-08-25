import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { auth } from "@/Auth";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import CollaboratorScorecard from "@/components/hiring/CollaboratorScorecard";
import CollaboratorPipelineControl from "@/components/hiring/CollaboratorPipelineControl";
import InterviewPanel from "@/components/hiring/InterviewPanel";
import RecruiterShell from "@/components/hiring/RecruiterShell";
import { getCollaborativeCandidateReview } from "@/lib/collaborative-hiring-reviews";

export default async function CollaborativeCandidatePage({ params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  const session = await auth();
  const { companyId, jobId, applicationId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}`)}`);
  const review = JSON.parse(JSON.stringify(await getCollaborativeCandidateReview(companyId, session.user.id, jobId, applicationId)));
  const { application } = review;
  return <RecruiterShell companyId={companyId} jobId={jobId} role={review.membership.role} active="queue" companyName={review.job.title}><main className="px-5 py-7 sm:px-8 sm:py-9"><div className="mx-auto max-w-6xl"><Link href={`/hiring/${companyId}/jobs/${jobId}`} className="text-sm font-semibold text-teal">← Back to review queue</Link><header className="mt-5 border-b border-ink/7 pb-5"><div className="flex items-start gap-4"><EmployerAvatar name={application.seeker.fullName} imageUrl={application.seeker.photoUrl} size="lg" shape="rounded" /><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#9A5B12]">Candidate review · {review.job.title}</p><h1 className="mt-1 font-display text-3xl font-black text-ink">{application.seeker.fullName}</h1><p className="text-sm text-ink/55">{application.seeker.headline || "Virtual Assistant"}</p></div><CollaboratorPipelineControl companyId={companyId} jobId={jobId} applicationId={applicationId} initialStatus={application.status} canMove={review.canMove} /></div></header><div className="grid gap-9 py-7 lg:grid-cols-2"><section><h2 className="font-display text-xl font-bold text-ink">Candidate snapshot</h2><div className="mt-4 flex flex-wrap gap-2">{application.seeker.skills.map((skill: string) => <span key={skill} className="rounded-full bg-teal/8 px-2 py-1 text-xs text-teal">{skill}</span>)}</div>{application.coverNote && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-ink/65">{application.coverNote}</p>}{application.seeker.resumeUrl && <a href={application.seeker.resumeUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal"><FileText className="h-4 w-4" />Open resume</a>}</section><div><CollaboratorScorecard companyId={companyId} jobId={jobId} applicationId={applicationId} canScore={review.canScore} template={review.template} ownEvaluation={review.ownEvaluation} submittedReviews={review.submittedReviews} feedbackLocked={review.feedbackLocked} /><InterviewPanel companyId={companyId} jobId={jobId} applicationId={applicationId} memberId={review.membership.id} canSchedule={review.canMove} /></div></div></div></main></RecruiterShell>;
}
