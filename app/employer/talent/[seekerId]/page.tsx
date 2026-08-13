import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getSeekerProfileForEmployer } from "@/lib/talent";
import { ApiError } from "@/lib/api-error";
import TalentProfileHero from "@/components/employer/talent/TalentProfileHero";
import TalentProfileAbout from "@/components/employer/talent/TalentProfileAbout";
import TalentProfileExperience from "@/components/employer/talent/TalentProfileExperience";
import TalentProfileEducation from "@/components/employer/talent/TalentProfileEducation";
import TalentApplicationHistory from "@/components/employer/talent/TalentApplicationHistory";
import TalentProfileRail from "@/components/employer/talent/TalentProfileRail";
import { requireEmployerPageContext } from "@/lib/employer-session";

export default async function EmployerSeekerProfilePage({
  params,
}: {
  params: Promise<{ seekerId: string }>;
}) {
  const { session } = await requireEmployerPageContext();
  const { seekerId } = await params;

  let data;
  try {
    data = await getSeekerProfileForEmployer(session.user.id, seekerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { profile, applications, saved, canDownloadResume } = data;

  const previewData = {
    fullName: profile.fullName,
    headline: profile.headline,
    location: profile.location,
    bio: profile.bio,
    skills: profile.skills ?? [],
    availability: profile.availability,
    yearsExperience: profile.yearsExperience,
    desiredSalaryMin: profile.desiredSalaryMin,
    desiredSalaryMax: profile.desiredSalaryMax,
    resumeUrl: profile.resumeUrl,
    linkedinUrl: profile.linkedinUrl,
    portfolioUrl: profile.portfolioUrl,
    certifications: profile.certifications ?? [],
    languages: profile.languages ?? [],
    workExperience: profile.workExperience ?? [],
    education: profile.education ?? [],
    timezone: profile.timezone,
    photoUrl: profile.photoUrl,
    visibility: profile.visibility,
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-4">
      <Link
        href="/employer/talent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/55 transition hover:text-teal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to talent search
      </Link>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <TalentProfileHero
            fullName={profile.fullName}
            headline={profile.headline}
            location={profile.location}
            photoUrl={profile.photoUrl}
            seekerId={profile.id}
            saved={saved}
            canDownloadResume={canDownloadResume}
            resumeUrl={profile.resumeUrl}
          />

          <TalentProfileAbout bio={profile.bio} languages={profile.languages ?? []} />

          <TalentProfileExperience workExperience={profile.workExperience ?? []} />

          <TalentProfileEducation
            education={profile.education ?? []}
            certifications={profile.certifications ?? []}
          />

          <TalentApplicationHistory
            applications={applications}
            seekerName={profile.fullName}
            seekerPhotoUrl={profile.photoUrl}
            seekerId={profile.id}
          />
        </div>

        <TalentProfileRail
          data={previewData}
          seekerId={profile.id}
          canDownloadResume={canDownloadResume}
        />
      </div>
    </div>
  );
}
