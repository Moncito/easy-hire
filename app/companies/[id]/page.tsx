import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Briefcase, Globe, Building2 } from "lucide-react";
import { getPublicCompany } from "@/lib/public-companies";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";
import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import Footer from "@/components/landing/Footer";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let company;
  try {
    company = await getPublicCompany(id);
  } catch {
    notFound();
  }

  const initials = company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-mist">
      <PublicJobsHeader />
      <div className="mx-auto max-w-5xl px-6 pb-10 pt-28">
        <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-xs">
          <div className="h-28 overflow-hidden sm:h-32">
            {company.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.bannerUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full bg-gradient-to-r from-teal/50 via-navy/40 to-teal/30" />
            )}
          </div>
          <div className="relative px-6 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logoUrl}
                    alt=""
                    className="h-20 w-20 rounded-2xl border-4 border-white bg-teal object-cover shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-teal font-display text-2xl font-bold text-white shadow-md">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                      {company.companyName}
                    </h1>
                    {company.verifiedStatus === "APPROVED" && (
                      <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                        Verified employer
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink/55">{company.industry || "Company"}</p>
                </div>
              </div>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  Website
                </a>
              )}
            </div>

            {company.description && (
              <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-ink/75">
                {company.description}
              </p>
            )}

            {company.highlights.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {company.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-lg bg-teal/8 px-2.5 py-1 text-xs font-semibold text-teal"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-ink/55">
              {company.headquarters && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {company.headquarters}
                </span>
              )}
              {company.teamSize && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  {company.teamSize} employees
                </span>
              )}
            </div>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold text-ink">
            Open roles ({company.jobs.length})
          </h2>
          {company.jobs.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No active job listings right now.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {company.jobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="block rounded-2xl border border-ink/5 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-ink">{job.title}</h3>
                        <p className="mt-1 text-sm text-ink/55">
                          {job.category} · {formatEnumLabel(job.employmentType)} ·{" "}
                          {formatEnumLabel(job.remoteType)}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink/55">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {job.location}
                        </p>
                      </div>
                      <p className="font-data text-sm font-semibold text-ink/70">
                        <Briefcase className="mr-1 inline h-4 w-4 text-teal" aria-hidden="true" />
                        {formatPesoRange(job.salaryMin, job.salaryMax)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <Footer />
    </div>
  );
}
