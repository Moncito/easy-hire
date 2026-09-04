import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPublicJob } from "@/lib/public-jobs";
import JobDetailTabs from "@/components/jobs/JobDetailTabs";
import JobDetailSidebar, { JobApplyCta } from "@/components/jobs/JobDetailSidebar";
import JobViewTracker from "@/components/jobs/JobViewTracker";
import JobsNavBand from "@/components/jobs/JobsNavBand";
import { listSavedJobIds } from "@/lib/saved-jobs";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import { getSeekerProfileCompletion } from "@/lib/seeker/profile-completion";
import { buildJobPostingJsonLd } from "@/lib/seo/job-posting-jsonld";
import { safeJsonLdString } from "@/lib/seo/safe-json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const job = await getPublicJob(id);
    return {
      title: `${job.title} at ${job.company.companyName}`,
      description: job.description.slice(0, 160),
      openGraph: {
        title: job.title,
        description: job.description.slice(0, 160),
        type: "website",
      },
    };
  } catch {
    return { title: "Job not found" };
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let job;
  try {
    job = await getPublicJob(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";
  const savedIds = session?.user ? await listSavedJobIds(session.user.id) : [];
  const isSaved = savedIds.includes(job.id);

  let metaLabel: string | null = null;
  let profileCompleted = 0;
  let profileTotal = 0;

  if (isSeeker && session?.user) {
    const profile = await ensureSeekerProfile(session.user.id, {
      fullName: session.user.name ?? "",
    });
    const { completed, total } = getSeekerProfileCompletion(profile);
    profileCompleted = completed;
    profileTotal = total;
    const firstName = session.user.name?.trim().split(/\s+/)[0];
    if (firstName) metaLabel = `Hi, ${firstName}`;
  }

  const jobData = {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    category: job.category,
    industry: job.industry,
    employmentType: job.employmentType,
    remoteType: job.remoteType,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    expiresAt: job.expiresAt?.toISOString() ?? null,
    company: job.company,
  };

  // See lib/seo/safe-json-ld.ts for why `safeJsonLdString` (not plain
  // JSON.stringify) is required here: job.description/requirements/benefits
  // are employer-supplied free text, and an unescaped `</script>` inside them
  // would prematurely close this tag — a stored-XSS vector.
  const jobPostingJsonLd = safeJsonLdString(buildJobPostingJsonLd(job));

  return (
    <div className="jobs-detail-scroll min-h-0 flex-1">
      {/* Structured data for Google for Jobs. __html is pre-escaped by
          safeJsonLdString (see lib/seo/safe-json-ld.ts) — never swap this
          for a raw JSON.stringify. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jobPostingJsonLd }}
      />
      <JobViewTracker jobId={job.id} />
      <JobsNavBand
        isSeeker={isSeeker}
        metaLabel={metaLabel}
        profileCompleted={profileCompleted}
        profileTotal={profileTotal}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <Link
          href="/jobs"
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/50 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <JobDetailTabs
              job={jobData}
              hideApplySection
              variant="page"
              applyAction={
                <div className="lg:hidden">
                  <JobApplyCta
                    jobId={job.id}
                    jobTitle={job.title}
                    companyName={job.company.companyName}
                    companyId={job.company.id}
                    screeningQuestions={job.screeningQuestions.map((q) => ({
                      id: q.id,
                      prompt: q.prompt,
                      required: q.required,
                    }))}
                  />
                </div>
              }
            />
          </div>

          <JobDetailSidebar
            jobId={job.id}
            jobTitle={job.title}
            company={job.company}
            isSaved={isSaved}
            screeningQuestions={job.screeningQuestions.map((q) => ({
              id: q.id,
              prompt: q.prompt,
              required: q.required,
            }))}
          />
        </div>
      </div>

      {/* Keeps company + apply CTA above the fixed mobile nav. Must be in-flow
          (not padding on a flex scroller) or it never extends scrollHeight. */}
      <div className="jobs-mobile-nav-clearance" aria-hidden="true" />
    </div>
  );
}