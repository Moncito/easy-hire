import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import {
  firstIncompleteBucket,
  getSeekerProfileCompletion,
} from "@/lib/seeker-profile-completion";
import JobSearchPanel from "@/components/jobs/JobSearchPanel";
import ProfileStrengthNudge from "@/components/jobs/ProfileStrengthNudge";

export default async function JobsPage() {
  const session = await auth();
  let nudge: { completed: number; total: number; firstIncomplete: string | null } | null = null;

  if (session?.user?.role === "SEEKER") {
    const profile = await ensureSeekerProfile(session.user.id, {
      fullName: session.user.name ?? "",
    });
    const { completed, total } = getSeekerProfileCompletion(profile);
    if (completed < total) {
      nudge = {
        completed,
        total,
        firstIncomplete: firstIncompleteBucket(profile),
      };
    }
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(242,169,59,0.12),_transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6 max-w-3xl animate-fade-in lg:mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Find virtual assistant jobs
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/55 sm:text-base">
            Browse verified roles from employers hiring Filipino virtual assistants. Remote-friendly
            opportunities with transparent PHP salary ranges.
          </p>
        </div>
        {nudge && (
          <ProfileStrengthNudge
            completed={nudge.completed}
            total={nudge.total}
            firstIncomplete={nudge.firstIncomplete}
          />
        )}
        <JobSearchPanel />
      </div>
    </div>
  );
}
