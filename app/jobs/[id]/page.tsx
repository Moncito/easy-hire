import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Building2, Globe, ArrowLeft } from "lucide-react";
import { getPublicJob } from "@/lib/public-jobs";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";
import ApplyButton from "@/components/jobs/ApplyButton";
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to jobs
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-marigold/10 px-2.5 py-1 text-[11px] font-semibold text-[#8a5a10]">
                {job.category}
              </span>
              <span className="rounded-lg bg-ink/4 px-2.5 py-1 text-[11px] font-semibold text-ink/65">
                {formatEnumLabel(job.employmentType)}
              </span>
              <span className="rounded-lg bg-teal/8 px-2.5 py-1 text-[11px] font-semibold text-teal">
                {formatEnumLabel(job.remoteType)}
              </span>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink">{job.title}</h1>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink/55">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-ink/35" aria-hidden="true" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 font-data font-semibold text-ink/70">
                <Briefcase className="h-4 w-4 text-teal" aria-hidden="true" />
                {formatPesoRange(job.salaryMin, job.salaryMax)}
              </span>
            </div>

            <section className="mt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink/45">About the role</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{job.description}</p>
            </section>

            {job.requirements && (
              <section className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink/45">Requirements</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{job.requirements}</p>
              </section>
            )}

            {job.benefits && (
              <section className="mt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-ink/45">Benefits</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{job.benefits}</p>
              </section>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              {job.company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.company.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal/10 font-display text-lg font-bold text-teal">
                  {initials}
                </div>
              )}
              <div>
                <p className="font-display text-base font-bold text-ink">{job.company.companyName}</p>
                {job.company.industry && (
                  <p className="text-xs text-ink/50">{job.company.industry}</p>
                )}
                {job.company.verifiedStatus === "APPROVED" && (
                  <span className="mt-1 inline-block rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                    Verified employer
                  </span>
                )}
              </div>
            </div>

            {job.company.website && (
              <a
                href={job.company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-teal hover:underline"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                Company website
              </a>
            )}

            <Link
              href={`/companies/${job.company.id}`}
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-ink/55 hover:text-teal"
            >
              <Building2 className="h-4 w-4" aria-hidden="true" />
              View company profile
            </Link>

            <div className="mt-6 rounded-xl bg-mist/80 p-4">
              <p className="text-sm font-semibold text-ink">Ready to apply?</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/50">
                Submit your profile and resume. Employers review applications on their Kanban board.
              </p>
              <ApplyButton jobId={job.id} jobTitle={job.title} companyName={job.company.companyName} />
            </div>          </div>
        </aside>
      </div>
    </div>
  );
}
