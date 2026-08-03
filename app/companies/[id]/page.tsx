import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";
import { getPublicCompany } from "@/lib/public-companies";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import { getSeekerProfileCompletion } from "@/lib/seeker-profile-completion";
import CompanyNavBand from "@/components/companies/CompanyNavBand";
import CompanyAboutSection from "@/components/companies/CompanyAboutSection";
import CompanyJobRow from "@/components/companies/CompanyJobRow";

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let company;
  try {
    company = await getPublicCompany(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";

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

  const initials = company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="animate-fade-in pb-20">
      <CompanyNavBand
        isSeeker={isSeeker}
        metaLabel={metaLabel}
        profileCompleted={profileCompleted}
        profileTotal={profileTotal}
      />

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/jobs"
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/50 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Link>

        {/* Profile header — open layout, subtle banner strip */}
        <header className="mt-8 border-b border-ink/[0.06] pb-8">
          {company.bannerUrl && (
            <div className="mb-6 h-20 overflow-hidden rounded-xl sm:h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.bannerUrl}
                alt=""
                className="h-full w-full object-cover opacity-90"
              />
            </div>
          )}

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-ink/8 sm:h-20 sm:w-20"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-teal/15 font-display text-xl font-bold text-teal ring-1 ring-teal/20 sm:h-20 sm:w-20">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                    {company.companyName}
                  </h1>
                  {company.verifiedStatus === "APPROVED" && (
                    <span className="inline-flex items-center rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                      Verified employer
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-ink/55">
                  {company.industry || "Employer on EasyHire"}
                </p>
              </div>
            </div>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold text-teal transition hover:text-teal/80"
              >
                <Globe className="h-4 w-4" aria-hidden="true" />
                Website
              </a>
            )}
          </div>
        </header>

        <div className="py-8">
          <CompanyAboutSection
            companyName={company.companyName}
            description={company.description}
            industry={company.industry}
            teamSize={company.teamSize}
            headquarters={company.headquarters}
            foundedYear={company.foundedYear}
            highlights={company.highlights}
            verifiedStatus={company.verifiedStatus}
            openRolesCount={company.jobs.length}
            website={company.website}
            linkedinUrl={company.linkedinUrl}
            facebookUrl={company.facebookUrl}
            instagramUrl={company.instagramUrl}
            xUrl={company.xUrl}
          />
        </div>

        <section className="border-t border-ink/[0.06] pt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Open roles
                <span className="ml-2 font-data text-base font-semibold text-ink/45">
                  ({company.jobs.length})
                </span>
              </h2>
              <p className="mt-1 text-sm text-ink/45">
                Direct applications — no middlemen, guaranteed PHP pay ranges where listed.
              </p>
            </div>
            <Link
              href="/jobs"
              className="text-sm font-semibold text-marigold hover:text-marigold/80"
            >
              Browse all jobs
            </Link>
          </div>

          {company.jobs.length === 0 ? (
            <p className="py-8 text-sm text-ink/50">
              No active listings right now. Save this employer or check back soon.
            </p>
          ) : (
            <div className="divide-y divide-ink/[0.06] border-y border-ink/[0.06]">
              {company.jobs.map((job) => (
                <CompanyJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
