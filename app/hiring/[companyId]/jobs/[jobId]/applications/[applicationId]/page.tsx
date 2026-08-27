import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Briefcase, CalendarClock, FileText, Mail, MapPin, Phone, TrendingUp } from "lucide-react";
import { auth } from "@/Auth";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import CollaboratorScorecard from "@/components/hiring/CollaboratorScorecard";
import CollaboratorPipelineControl from "@/components/hiring/CollaboratorPipelineControl";
import InterviewPanel from "@/components/hiring/InterviewPanel";
import MessageCandidateButton from "@/components/hiring/MessageCandidateButton";
import ApplicationActivityFeed from "@/components/hiring/ApplicationActivityFeed";
import { getCollaborativeCandidateReview } from "@/lib/collaborative-hiring-reviews";
import { hasCollaborativePermission } from "@/lib/collaborative-hiring";
import { formatSalaryRange } from "@/lib/shared/format";

const cardClass = "rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(32,36,43,0.04)]";

export default async function CollaborativeCandidatePage({ params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  const session = await auth();
  const { companyId, jobId, applicationId } = await params;
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(`/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}`)}`);
  const review = JSON.parse(JSON.stringify(await getCollaborativeCandidateReview(companyId, session.user.id, jobId, applicationId)));
  const { application, activities } = review;
  const { seeker } = application;
  const canMessage = hasCollaborativePermission(review.membership.role, "messages:manage");

  const appliedDate = new Date(application.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const resumeUpdated = seeker.resumeUpdatedAt
    ? new Date(seeker.resumeUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <Link href={`/hiring/${companyId}/jobs/${jobId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
        <ArrowLeft className="h-4 w-4" />
        Back to review queue
      </Link>

      <header className="mt-5 flex flex-col gap-4 border-b border-ink/7 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <EmployerAvatar name={seeker.fullName} imageUrl={seeker.photoUrl} size="lg" shape="rounded" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#9A5B12]">Candidate review · {review.job.title}</p>
            <h1 className="mt-1 truncate font-display text-3xl font-black text-ink">{seeker.fullName}</h1>
            <p className="mt-1 text-sm text-ink/55">{seeker.headline || "Virtual Assistant"} · Applied {appliedDate}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canMessage && <MessageCandidateButton companyId={companyId} jobId={jobId} seekerId={application.seekerId} />}
          <CollaboratorPipelineControl companyId={companyId} jobId={jobId} applicationId={applicationId} initialStatus={application.status} canMove={review.canMove} />
        </div>
      </header>

      <div className="grid gap-6 py-7 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className={cardClass}>
            <h2 className="font-display text-lg font-bold text-ink">Candidate snapshot</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {seeker.skills.map((skill: string) => (
                <span key={skill} className="rounded-full bg-teal/8 px-2.5 py-1 text-xs font-semibold text-teal">{skill}</span>
              ))}
              {!seeker.skills.length && <p className="text-sm text-ink/45">No skills listed.</p>}
            </div>
            {application.coverNote && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-ink/65">{application.coverNote}</p>}
            {seeker.resumeUrl && (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-mist/50 p-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal/10 text-teal">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{seeker.resumeLabel || "Resume"}</p>
                    {resumeUpdated && <p className="text-xs text-ink/45">Updated {resumeUpdated}</p>}
                  </div>
                </div>
                <a
                  href={seeker.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 cursor-pointer items-center rounded-lg border border-teal/30 px-3.5 py-1.5 text-xs font-bold text-teal transition hover:bg-teal/5"
                >
                  View
                </a>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-lg font-bold text-ink">Application details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-mist/50 p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                  <Briefcase className="h-3.5 w-3.5" />
                  Role
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-ink">{review.job.title}</dd>
              </div>
              <div className="rounded-xl bg-mist/50 p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                  Expected salary
                </dt>
                <dd className="mt-1.5 font-data text-sm font-semibold text-ink">{formatSalaryRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax)}</dd>
              </div>
              <div className="rounded-xl bg-mist/50 p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Experience
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-ink">{seeker.yearsExperience || "Not specified"}</dd>
              </div>
              <div className="rounded-xl bg-mist/50 p-3.5">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Availability
                </dt>
                <dd className="mt-1.5 text-sm font-semibold text-ink">{seeker.availability || "Not specified"}</dd>
              </div>
            </dl>
          </section>

          <ApplicationActivityFeed
            companyId={companyId}
            jobId={jobId}
            applicationId={applicationId}
            appliedAt={application.appliedAt}
            initialActivities={activities}
            canAddActivity={review.canAddActivity}
          />
        </div>

        <div className="space-y-6">
          <CollaboratorScorecard
            companyId={companyId}
            jobId={jobId}
            applicationId={applicationId}
            canScore={review.canScore}
            template={review.template}
            ownEvaluation={review.ownEvaluation}
            submittedReviews={review.submittedReviews}
            feedbackLocked={review.feedbackLocked}
          />
          <InterviewPanel companyId={companyId} jobId={jobId} applicationId={applicationId} memberId={review.membership.id} canSchedule={review.canMove} />

          <section className={cardClass}>
            <h2 className="font-display text-lg font-bold text-ink">Contact</h2>
            <div className="mt-4 space-y-3">
              {seeker.user.email && (
                <a href={`mailto:${seeker.user.email}`} className="flex cursor-pointer items-center gap-3 text-sm text-ink/70 transition hover:text-teal">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-ink/50">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="truncate">{seeker.user.email}</span>
                </a>
              )}
              {seeker.phone && (
                <div className="flex items-center gap-3 text-sm text-ink/70">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-ink/50">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="font-data">{seeker.phone}</span>
                </div>
              )}
              {seeker.location && (
                <div className="flex items-center gap-3 text-sm text-ink/70">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/[0.05] text-ink/50">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span>{seeker.location}</span>
                </div>
              )}
              {!seeker.user.email && !seeker.phone && !seeker.location && <p className="text-sm text-ink/45">No contact details on file.</p>}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
