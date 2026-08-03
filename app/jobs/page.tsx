import { auth } from "@/Auth";
import { ensureSeekerProfile } from "@/lib/seekers";
import {
  firstIncompleteBucket,
  getSeekerProfileCompletion,
} from "@/lib/seeker-profile-completion";
import JobSearchPanel from "@/components/jobs/JobSearchPanel";
import ProfileStrengthNudge from "@/components/jobs/ProfileStrengthNudge";
import CollapsibleJobsHeader from "@/components/jobs/CollapsibleJobsHeader";
import JobsNavBand from "@/components/jobs/JobsNavBand";

export default async function JobsPage() {
  const session = await auth();
  const isSeeker = session?.user?.role === "SEEKER";

  let nudge: { completed: number; total: number; firstIncomplete: string | null } | null = null;
  let profileCompleted = 0;
  let profileTotal = 0;
  let metaLabel: string | null = null;

  if (isSeeker && session?.user) {
    const profile = await ensureSeekerProfile(session.user.id, {
      fullName: session.user.name ?? "",
    });
    const { completed, total } = getSeekerProfileCompletion(profile);
    profileCompleted = completed;
    profileTotal = total;

    const firstName = session.user.name?.trim().split(/\s+/)[0];
    if (firstName) metaLabel = `Hi, ${firstName}`;

    if (completed < total) {
      nudge = {
        completed,
        total,
        firstIncomplete: firstIncompleteBucket(profile),
      };
    }
  }

  return (
    <div className="jobs-list-viewport relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <JobsNavBand
        isSeeker={isSeeker}
        metaLabel={metaLabel}
        profileCompleted={profileCompleted}
        profileTotal={profileTotal}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-14 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(242,169,59,0.12),_transparent_60%)] sm:top-16 lg:hidden"
        aria-hidden="true"
      />
      <div className="relative flex h-full w-full min-h-0 flex-1 flex-col px-4 pb-4 pt-2 sm:px-6 sm:pb-5 sm:pt-3 lg:px-0 lg:pb-0 lg:pt-0">
        {!isSeeker && (
          <div className="mb-2 shrink-0 lg:hidden">
            <CollapsibleJobsHeader />
          </div>
        )}
        {nudge && (
          <div className="shrink-0 lg:hidden">
            <ProfileStrengthNudge
              completed={nudge.completed}
              total={nudge.total}
              firstIncomplete={nudge.firstIncomplete}
              compact
            />
          </div>
        )}
        <JobSearchPanel />
      </div>
    </div>
  );
}
