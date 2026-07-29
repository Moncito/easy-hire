import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import SeekerProfileEditor from "@/components/seeker/SeekerProfileEditor";
import { PROFILE_BUCKETS, type ProfileBucketId } from "@/components/seeker/profile-buckets";

function parseInitialBucket(value?: string): ProfileBucketId | undefined {
  if (!value) return undefined;
  return PROFILE_BUCKETS.some((b) => b.id === value) ? (value as ProfileBucketId) : undefined;
}

export default async function SeekerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ bucket?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { bucket } = await searchParams;
  const profile = await ensureSeekerProfile(session.user.id, {
    fullName: session.user.name ?? "",
  });

  return (
    <>
      <div className="mb-6 animate-fade-in lg:mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">My profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">
          Your profile works for you 24/7 — complete each section so verified employers find you
          in talent search and trust you when you apply.
        </p>
      </div>
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
    </>
  );
}
