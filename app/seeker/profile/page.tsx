import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { ensureSeekerProfile } from "@/lib/seekers";
import { hydrateResumeFields } from "@/lib/seeker/resume-urls";
import { listIdentityDocuments, getVerificationScoreBreakdown } from "@/lib/seeker/identity-verification";
import { firstIncompleteBucket } from "@/lib/seeker/profile-completion";
import SeekerProfileAccountLinks from "@/components/seeker/SeekerProfileAccountLinks";
import SeekerProfileEditor from "@/components/seeker/SeekerProfileEditor";
import ProfileHeaderCard from "@/components/seeker/ProfileHeaderCard";
import IdentityVerificationPanel from "@/components/seeker/IdentityVerificationPanel";
import { PROFILE_BUCKETS, profileBucketCompletion, type ProfileBucketId } from "@/components/seeker/profile-buckets";
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
  // All three depend on the profile existing (ensured above), but not on
  // each other — run them concurrently. The breakdown reads ensuredProfile
  // directly (not the hydrated one) since hydration only re-signs resume
  // URLs for display and doesn't affect any completion-relevant field.
  const [profile, identityDocuments, verificationScoreResult] = await Promise.all([
    hydrateResumeFields(ensuredProfile),
    listIdentityDocuments(userId),
    getVerificationScoreBreakdown(userId, ensuredProfile),
  ]);

  const { completed, total } = profileBucketCompletion({
    fullName: profile.fullName ?? "",
    headline: profile.headline ?? "",
    location: profile.location ?? "",
    bio: profile.bio ?? "",
    skills: profile.skills ?? [],
    availability: profile.availability,
    yearsExperience: profile.yearsExperience,
    desiredSalaryMin: profile.desiredSalaryMin,
    desiredSalaryMax: profile.desiredSalaryMax,
    resumeUrl: profile.resumeUrl,
    linkedinUrl: profile.linkedinUrl ?? "",
    portfolioUrl: profile.portfolioUrl ?? "",
    certifications: profile.certifications ?? [],
    languages: profile.languages ?? [],
    workExperience: profile.workExperience ?? [],
    education: profile.education ?? [],
    timezone: profile.timezone ?? "Asia/Manila",
    photoUrl: profile.photoUrl,
    visibility: profile.visibility ?? "STANDARD",
  });

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
        completed={completed}
        total={total}
        idVerificationStatus={profile.idVerificationStatus}
      />
      <SeekerProfileEditor
        profileId={profile.id}
        profileUpdatedAt={profile.updatedAt.toISOString()}
        initialBucket={parseInitialBucket(bucket)}
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

      <div className="mt-5 lg:mt-6">
        <IdentityVerificationPanel
          status={profile.idVerificationStatus}
          rejectionReason={profile.idVerificationRejectionReason}
          score={verificationScoreResult.score}
          breakdown={verificationScoreResult.breakdown}
          idVerifiedAt={profile.idVerifiedAt?.toISOString() ?? null}
          profileBucketsCompleted={completed}
          profileBucketsTotal={total}
          firstIncompleteBucket={firstIncompleteBucket(profile)}
          publicProfileHref={`/seekers/${profile.id}`}
          initialDocuments={identityDocuments.map((doc) => ({
            id: doc.id,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            docType: doc.docType,
            uploadedAt: doc.uploadedAt.toISOString(),
          }))}
        />
      </div>
      </div>
    </>
  );
}
