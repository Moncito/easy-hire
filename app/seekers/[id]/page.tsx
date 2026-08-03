import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicSeeker } from "@/lib/public-seekers";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import { getSeekerProfileCompletion } from "@/lib/seeker-profile-completion";
import PublicSeekerNavBand from "@/components/seekers/PublicSeekerNavBand";
import PublicSeekerProfileSections from "@/components/seekers/PublicSeekerProfileSections";

export default async function PublicSeekerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let seeker;
  try {
    seeker = await getPublicSeeker(id);
  } catch {
    notFound();
  }

  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";
  const isEmployer = session?.user?.role === "EMPLOYER";

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

  const backHref = isEmployer ? "/employer/talent" : "/jobs";
  const backLabel = isEmployer ? "Back to talent search" : "Back to jobs";

  const initials = seeker.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="animate-fade-in pb-20">
      <PublicSeekerNavBand
        isSeeker={isSeeker}
        metaLabel={metaLabel}
        profileCompleted={profileCompleted}
        profileTotal={profileTotal}
      />

      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink/50 transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {backLabel}
        </Link>

        <header className="mt-8 flex flex-col gap-5 border-b border-ink/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {seeker.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seeker.photoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-ink/8 sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-marigold/12 font-display text-xl font-bold text-marigold ring-1 ring-marigold/15 sm:h-20 sm:w-20">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                Public profile
              </span>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
                {seeker.fullName}
              </h1>
              <p className="mt-1 text-sm font-medium text-ink/55">
                {seeker.headline || "Virtual Assistant"}
              </p>
            </div>
          </div>

          {isSeeker && (
            <Link
              href="/jobs"
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-marigold px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-marigold/90"
            >
              Browse jobs
            </Link>
          )}
        </header>

        <div className="py-8">
          <PublicSeekerProfileSections
            seeker={{
              fullName: seeker.fullName,
              headline: seeker.headline,
              bio: seeker.bio,
              location: seeker.location,
              timezone: seeker.timezone,
              desiredSalaryMin: seeker.desiredSalaryMin,
              desiredSalaryMax: seeker.desiredSalaryMax,
              yearsExperience: seeker.yearsExperience,
              availability: seeker.availability,
              skills: seeker.skills,
              workExperience: seeker.workExperience,
              education: seeker.education,
              languages: seeker.languages,
              certifications: seeker.certifications,
              linkedinUrl: seeker.linkedinUrl,
              portfolioUrl: seeker.portfolioUrl,
              resumeUrl: seeker.resumeUrl,
              updatedAt: seeker.updatedAt,
            }}
          />
        </div>
      </div>
    </div>
  );
}
