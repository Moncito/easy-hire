import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Wallet, Building2, Globe, ArrowLeft, Briefcase } from "lucide-react";
import { getPublicJob } from "@/lib/public-jobs";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";
import ApplyButton from "@/components/jobs/ApplyButton";
import MarkdownContent from "@/components/ui/MarkdownContent";

function JobSection({ title, content }: { title: string; content: string }) {
  return (
    <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-[0_8px_30px_rgba(30,58,95,0.04)] sm:p-8">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-4">
        <MarkdownContent content={content} />
      </div>
    </section>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let job;
  try {
    job = await getPublicJob(id);
  } catch {
    notFound();
  }

  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          <div className="space-y-6">
            <header className="rounded-2xl border border-navy/8 bg-white p-6 shadow-[0_8px_30px_rgba(30,58,95,0.04)] sm:p-8">
              <div className="flex flex-wrap items-start gap-4">
                {job.company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.company.logoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white object-cover shadow-md sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-marigold/15 font-display text-xl font-bold text-marigold shadow-md sm:h-20 sm:w-20">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-marigold/12 px-2.5 py-1 text-[11px] font-semibold text-[#8a5a10]">
                      {job.category}
                    </span>
                    <span className="rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-ink/65">
                      {formatEnumLabel(job.employmentType)}
                    </span>
                    <span className="rounded-lg bg-teal/10 px-2.5 py-1 text-[11px] font-semibold text-teal">
                      {formatEnumLabel(job.remoteType)}
                    </span>
                  </div>
                  <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
                    {job.title}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-ink/55">{job.company.companyName}</p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink/60">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-navy/50" aria-hidden="true" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-data font-semibold text-ink/80">
                      <Wallet className="h-4 w-4 text-navy/50" aria-hidden="true" />
                      {formatPesoRange(job.salaryMin, job.salaryMax)}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <JobSection title="About the role" content={job.description} />

            {job.requirements && (
              <JobSection title="Requirements" content={job.requirements} />
            )}

            {job.benefits && (
              <JobSection title="Benefits & perks" content={job.benefits} />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-[0_8px_30px_rgba(30,58,95,0.04)]">
              <div className="flex items-center gap-3 border-b border-ink/5 pb-4">
                {job.company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.company.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="font-display font-bold text-ink">{job.company.companyName}</p>
                  {job.company.industry && (
                    <p className="text-xs text-ink/50">{job.company.industry}</p>
                  )}
                </div>
              </div>

              {job.company.verifiedStatus === "APPROVED" && (
                <span className="mt-4 inline-block rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                  Verified employer
                </span>
              )}

              {job.company.headquarters && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/55">
                  <Briefcase className="h-3.5 w-3.5" />
                  {job.company.headquarters}
                </p>
              )}

              {job.company.website && (
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm text-teal hover:underline"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  Company website
                </a>
              )}

              <Link
                href={`/companies/${job.company.id}`}
                className="mt-2 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ink/55 hover:text-teal"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                View company profile
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
