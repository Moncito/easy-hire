import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import {
  firstIncompleteBucket,
  getSeekerProfileCompletion,
} from "@/lib/seeker-profile-completion";
import JobSearchPanel from "@/components/jobs/JobSearchPanel";
import ProfileStrengthNudge from "@/components/jobs/ProfileStrengthNudge";
import CollapsibleJobsHeader from "@/components/jobs/CollapsibleJobsHeader";

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
    <div className="relative flex min-h-0 flex-1 flex-col lg:overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(242,169,59,0.12),_transparent_60%)] lg:hidden"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col px-4 pb-4 pt-1 sm:px-6 sm:pb-5 lg:px-8 lg:pb-2 lg:pt-0">
        <CollapsibleJobsHeader />
        {nudge && (
          <ProfileStrengthNudge
            completed={nudge.completed}
            total={nudge.total}
            firstIncomplete={nudge.firstIncomplete}
            compact
          />
        )}
        <JobSearchPanel />
      </div>
    </div>
  );
}
