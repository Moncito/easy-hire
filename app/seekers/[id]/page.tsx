import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, ExternalLink, Link2, FileText, Briefcase, GraduationCap } from "lucide-react";
import PublicJobsHeader from "@/components/jobs/PublicJobsHeader";
import Footer from "@/components/landing/Footer";
import { getPublicSeeker } from "@/lib/public-seekers";
import { formatPesoRange } from "@/lib/format";
import {
  displayCertification,
  displayEducation,
  displayLanguage,
  displaySkill,
  displayWorkExperience,
  formatRelativeUpdated,
  timezoneLabel,
} from "@/lib/seeker-profile-format";

export default async function PublicSeekerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let seeker;
  try {
    seeker = await getPublicSeeker(id);
  } catch {
    notFound();
  }

  const initials = seeker.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-mist">
      <PublicJobsHeader />
      <div className="header-offset mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-[0_8px_30px_rgba(30,58,95,0.04)]">
          <div className="h-24 bg-gradient-to-r from-marigold/30 via-navy/20 to-teal/25 sm:h-28" />
          <div className="relative px-6 pb-8 sm:px-8">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                {seeker.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={seeker.photoUrl}
                    alt=""
                    className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-md sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-marigold/15 font-display text-2xl font-bold text-marigold shadow-md sm:h-24 sm:w-24">
                    {initials}
                  </div>
                )}
                <div>
                  <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                    Public profile
                  </span>
                  <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{seeker.fullName}</h1>
                  <p className="mt-1 text-sm text-ink/55">{seeker.headline || "Virtual Assistant"}</p>
                </div>
              </div>
              <Link
                href="/jobs"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
              >
                Browse jobs
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-ink/55">
              {seeker.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {seeker.location}
                </span>
              )}
              {seeker.timezone && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  {timezoneLabel(seeker.timezone)}
                </span>
              )}
              {(seeker.desiredSalaryMin || seeker.desiredSalaryMax) && (
                <span className="font-data font-semibold text-ink/75">
                  {formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax)}
                </span>
              )}
            </div>

            {seeker.skills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {seeker.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg bg-marigold/10 px-2.5 py-1 text-xs font-semibold text-[#8a5a10]"
                  >
                    {displaySkill(skill)}
                  </span>
                ))}
              </div>
            )}

            {seeker.bio && (
              <section className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50">About</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/75">{seeker.bio}</p>
              </section>
            )}

            {seeker.workExperience.length > 0 && (
              <section className="mt-8">
                <h2 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/50">
                  <Briefcase className="h-3.5 w-3.5" />
                  Experience
                </h2>
                <ul className="mt-3 space-y-3">
                  {seeker.workExperience.map((entry) => (
                    <li key={entry} className="rounded-xl border border-ink/8 bg-mist/40 px-4 py-3 text-sm text-ink/75">
                      {displayWorkExperience(entry)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {seeker.education.length > 0 && (
              <section className="mt-8">
                <h2 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/50">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Education
                </h2>
                <ul className="mt-3 space-y-2">
                  {seeker.education.map((entry) => (
                    <li key={entry} className="text-sm text-ink/75">
                      {displayEducation(entry)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {seeker.languages.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50">Languages</h2>
                <ul className="mt-2 space-y-1">
                  {seeker.languages.map((lang) => (
                    <li key={lang} className="text-sm text-ink/70">
                      {displayLanguage(lang)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {seeker.certifications.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-wider text-navy/50">Certifications</h2>
                <ul className="mt-2 space-y-1">
                  {seeker.certifications.map((cert) => (
                    <li key={cert} className="text-sm text-ink/70">
                      {displayCertification(cert)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-8 flex flex-wrap gap-3 border-t border-ink/5 pt-6">
              {seeker.resumeUrl && (
                <a
                  href={seeker.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-marigold/10 px-4 py-2.5 text-sm font-semibold text-[#8a5a10] hover:bg-marigold/15"
                >
                  <FileText className="h-4 w-4" />
                  View resume
                </a>
              )}
              {seeker.linkedinUrl && (
                <a
                  href={seeker.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:border-teal/30"
                >
                  <Link2 className="h-4 w-4 text-teal" />
                  LinkedIn
                </a>
              )}
              {seeker.portfolioUrl && (
                <a
                  href={seeker.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:border-navy/30"
                >
                  <ExternalLink className="h-4 w-4 text-navy" />
                  Portfolio
                </a>
              )}
            </div>

            <p className="mt-6 text-xs text-ink/40">
              Profile updated {formatRelativeUpdated(seeker.updatedAt)}
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
