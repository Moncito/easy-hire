import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { listSavedJobs } from "@/lib/saved-jobs";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import SavedJobsPanel from "@/components/seeker/SavedJobsPanel";
import { Bookmark } from "lucide-react";

export default async function SavedJobsPage() {
  const session = await auth();
  const saved = session?.user ? await listSavedJobs(session.user.id) : [];

  let appliedJobIds: string[] = [];
  if (session?.user && saved.length > 0) {
    const profile = await prisma.seekerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (profile) {
      const apps = await prisma.application.findMany({
        where: {
          seekerId: profile.id,
          jobId: { in: saved.map((s) => s.job.id) },
        },
        select: { jobId: true },
      });
      appliedJobIds = apps.map((a) => a.jobId);
    }
  }

  const countLabel =
    saved.length === 1 ? "1 saved role" : `${saved.length} saved roles`;

  return (
    <div className="animate-fade-in pb-16">
      <SeekerNavBandBleed
        section="Saved jobs"
        icon={Bookmark}
        badge={
          saved.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
              {countLabel}
            </span>
          ) : undefined
        }
        hint="Your shortlist"
      />

      <div className="pt-6 sm:pt-8">
        <SavedJobsPanel initialSaved={saved} appliedJobIds={appliedJobIds} />
      </div>
    </div>
  );
}
