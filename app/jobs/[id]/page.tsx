import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicJob } from "@/lib/public-jobs";
import ApplyButton from "@/components/jobs/ApplyButton";
import SaveJobButton from "@/components/jobs/SaveJobButton";
import JobDetailContent from "@/components/jobs/JobDetailContent";
import { listSavedJobIds } from "@/lib/saved-jobs";
import { auth } from "@/Auth";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let job;
  try {
    job = await getPublicJob(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const savedIds = session?.user ? await listSavedJobIds(session.user.id) : [];
  const isSaved = savedIds.includes(job.id);

  return (
    <div className="relative min-h-screen bg-mist pb-16">
      {/* Company hero */}
      <div className="relative h-44 w-full overflow-hidden sm:h-52 lg:h-60">
        {job.company.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.company.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-navy via-navy/90 to-teal/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/jobs"
          className="absolute -top-36 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-ink shadow-sm backdrop-blur-sm transition hover:bg-white sm:-top-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Link>

        <div className="-mt-14 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl bg-white p-6 sm:p-8">
            <JobDetailContent
              job={{
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
              }}
            />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-[0_8px_30px_rgba(30,58,95,0.04)]">
              <div className="flex items-center justify-between gap-3 border-b border-ink/5 pb-4">
                <div className="flex items-center gap-3">
                  {job.company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={job.company.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy">
                      {job.company.companyName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-display font-bold text-ink">{job.company.companyName}</p>
                    {job.company.industry && (
                      <p className="text-xs text-ink/50">{job.company.industry}</p>
                    )}
                  </div>
                </div>
                <SaveJobButton jobId={job.id} saved={isSaved} className="shrink-0" />
              </div>

              <Link
                href={`/companies/${job.company.id}`}
                className="mt-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink/55 hover:text-teal"
              >
                View full company profile
              </Link>

              <div className="mt-6 rounded-xl border border-marigold/25 bg-marigold/10 p-5">
                <p className="font-display text-base font-bold text-ink">Ready to apply?</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/55">
                  Your profile and resume go straight to the employer&apos;s applicant board.
                </p>
                <ApplyButton jobId={job.id} jobTitle={job.title} companyName={job.company.companyName} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
