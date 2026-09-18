import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { ensureSeekerProfile } from "@/lib/seekers";
import { hydrateResumeFields } from "@/lib/seeker/resume-urls";
import { toBucketCompletionState } from "@/lib/seeker/profile-completion";
import SeekerProfileAccountLinks from "@/components/seeker/SeekerProfileAccountLinks";
import SeekerProfileEditor from "@/components/seeker/SeekerProfileEditor";
import ProfileHeaderCard from "@/components/seeker/ProfileHeaderCard";
import { PROFILE_BUCKETS, isBucketComplete, profileBucketCompletion, type ProfileBucketId } from "@/components/seeker/profile-buckets";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import { User } from "lucide-react";

function parseInitialBucket(value?: string): ProfileBucketId | undefined {
  if (!value) return undefined;
  return PROFILE_BUCKETS.some((b) => b.id === value) ? (value as ProfileBucketId) : undefined;
}

export default async function SeekerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string }>;
}) {
  const { session, userId } = await requireSeekerPageContext();
  const { bucket } = await searchParams;
  const ensuredProfile = await ensureSeekerProfile(userId, {
    fullName: session.user.name ?? "",
  });
  // The profile fetch is the only piece other page sections still need
  // here — identity documents/score now live on the dedicated identity
  // page. hydrateResumeFields only re-signs resume URLs for display.
  const profile = await hydrateResumeFields(ensuredProfile);

  const bucketState = toBucketCompletionState(profile);
  const { completed, total } = profileBucketCompletion(bucketState);
  const bucketStatus = PROFILE_BUCKETS.map((b) => ({
    id: b.id,
    label: b.label,
    complete: isBucketComplete(b.id, bucketState),
  }));
  const publicProfileHref = `/seekers/${profile.id}`;

  return (
    <>
      <SeekerNavBandBleed
        section="Profile"
        icon={User}
        metaLabel={profile.headline?.trim() || null}
        hint="Professional presence"
      />

      <div className="pt-6 sm:pt-8">
      <div className="mb-6 animate-fade-in lg:mb-8">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">My profile</h1>
        <p className="mt-1.5 text-sm text-ink/50">Manage your professional presence</p>
      </div>
      <SeekerProfileAccountLinks />
      <ProfileHeaderCard
        fullName={profile.fullName ?? ""}
        headline={profile.headline}
        photoUrl={profile.photoUrl}
        location={profile.location}
        bio={profile.bio}
        yearsExperience={profile.yearsExperience}
        availability={profile.availability}
        desiredSalaryMin={profile.desiredSalaryMin}
        desiredSalaryMax={profile.desiredSalaryMax}
        completed={completed}
        total={total}
        idVerificationStatus={profile.idVerificationStatus}
        skills={profile.skills ?? []}
        bucketStatus={bucketStatus}
        publicProfileHref={publicProfileHref}
      />
      <SeekerProfileEditor
        profileId={profile.id}
        profileUpdatedAt={profile.updatedAt.toISOString()}
        initialBucket={parseInitialBucket(bucket)}
        idVerificationStatus={profile.idVerificationStatus}
        initialData={{
          fullName: profile.fullName ?? "",
          phone: profile.phone ?? "",
          location: profile.location ?? "",
          headline: profile.headline ?? "",
          bio: profile.bio ?? "",
          skills: profile.skills ?? [],
          availability: profile.availability,
          yearsExperience: profile.yearsExperience,
          desiredSalaryMin: profile.desiredSalaryMin,
          desiredSalaryMax: profile.desiredSalaryMax,
          resumeUrl: profile.resumeUrl,
          resumeLabel: profile.resumeLabel ?? "",
          resumeUpdatedAt: profile.resumeUpdatedAt?.toISOString() ?? null,
          resumes: profile.resumes ?? [],
          linkedinUrl: profile.linkedinUrl ?? "",
          portfolioUrl: profile.portfolioUrl ?? "",
          certifications: profile.certifications ?? [],
          languages: profile.languages ?? [],
          workExperience: profile.workExperience ?? [],
          education: profile.education ?? [],
          timezone: profile.timezone ?? "Asia/Manila",
          photoUrl: profile.photoUrl,
          visibility: profile.visibility ?? "STANDARD",
        }}
      />
      </div>
    </>
  );
}
