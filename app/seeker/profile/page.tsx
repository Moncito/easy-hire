import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import SeekerProfileEditor from "@/components/seeker/SeekerProfileEditor";

export default async function SeekerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await ensureSeekerProfile(session.user.id, {
    fullName: session.user.name ?? "",
  });

  return (
    <>
      <div className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-ink">My profile</h1>
        <p className="mt-2 text-sm text-ink/60">
          Build a complete profile — employers review this when you apply and in talent search.
        </p>
      </div>
      <SeekerProfileEditor
        initialData={{
          fullName: profile.fullName,
          phone: profile.phone,
          location: profile.location,
          headline: profile.headline,
          bio: profile.bio,
          skills: profile.skills,
          availability: profile.availability,
          yearsExperience: profile.yearsExperience,
          desiredSalaryMin: profile.desiredSalaryMin,
          desiredSalaryMax: profile.desiredSalaryMax,
          resumeUrl: profile.resumeUrl,
          linkedinUrl: profile.linkedinUrl,
          portfolioUrl: profile.portfolioUrl,
          certifications: profile.certifications ?? [],
          photoUrl: profile.photoUrl,
          profileVisibility: profile.profileVisibility,
        }}
      />
    </>
  );
}
