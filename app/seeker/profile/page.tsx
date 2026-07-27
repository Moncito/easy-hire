import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import SeekerProfileEditor from "@/components/seeker/SeekerProfileEditor";

export default async function SeekerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) redirect("/seeker/dashboard");

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">My profile</h1>
        <p className="mt-2 text-sm text-ink/60">
          Keep your profile up to date so employers can review your application.
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
        }}
      />
    </>
  );
}
