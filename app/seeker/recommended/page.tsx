import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { getSeekerJobRecommendations } from "@/lib/seeker/job-recommendations";
import { listSavedJobIds } from "@/lib/seeker/saved-jobs";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";
import RecommendedJobsSection from "@/components/seeker/RecommendedJobsSection";
import { Sparkles } from "lucide-react";

export default async function RecommendedJobsPage() {
  const { userId } = await requireSeekerPageContext();
  const [recommendations, savedJobIds] = await Promise.all([
    getSeekerJobRecommendations(userId),
    listSavedJobIds(userId),
  ]);

  const countLabel =
    recommendations.status === "ok" && recommendations.items.length > 0
      ? recommendations.items.length === 1
        ? "1 match"
        : `${recommendations.items.length} matches`
      : null;

  return (
    <div className="animate-fade-in pb-16">
      <SeekerNavBandBleed
        section="Recommended"
        icon={Sparkles}
        badge={
          countLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-wide text-[#8a5a10]">
              {countLabel}
            </span>
          ) : undefined
        }
        hint="Jobs matched to your profile"
      />

      <div className="pt-6 sm:pt-8">
        <RecommendedJobsSection recommendations={recommendations} variant="page" savedJobIds={savedJobIds} />
      </div>
    </div>
  );
}
