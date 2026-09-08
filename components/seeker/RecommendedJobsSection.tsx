import Link from "next/link";
import { Sparkles, ChevronRight, Bell } from "lucide-react";
import type { SeekerRecommendations } from "@/lib/seeker/job-recommendations";
import RecommendedJobCard from "@/components/seeker/RecommendedJobCard";

type Props = {
  recommendations: SeekerRecommendations;
  variant: "dashboard" | "page";
  savedJobIds: string[];
};

/**
 * The seeker's profile has no skills, no headline, and no desired salary
 * range yet — the scorer has nothing to work with. Naming the three
 * specific fields (rather than a vague "complete your profile") is a
 * deliberate copy decision from the brief.
 */
function ProfileIncompletePrompt({ variant }: { variant: "dashboard" | "page" }) {
  if (variant === "dashboard") {
    return (
      <p className="text-sm text-ink/50">
        Add your <span className="font-semibold text-ink/70">skills</span>,{" "}
        <span className="font-semibold text-ink/70">headline</span>, and{" "}
        <span className="font-semibold text-ink/70">desired salary range</span> to your
        profile so we can start matching you with roles.{" "}
        <Link href="/seeker/profile" className="font-semibold text-marigold hover:underline">
          Update your profile
        </Link>
      </p>
    );
  }

  return (
    <div className="py-16 text-center animate-slide-up">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.04]">
        <Sparkles className="h-8 w-8 text-ink/20" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-display text-lg font-bold text-ink">
        We need a bit more about you first
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/50">
        Matches are built from three things on your profile:{" "}
        <span className="font-semibold text-ink/70">skills</span>,{" "}
        <span className="font-semibold text-ink/70">headline</span>, and your{" "}
        <span className="font-semibold text-ink/70">desired salary range</span>. Fill those in
        and matches will start showing up here.
      </p>
      <Link
        href="/seeker/profile"
        className="mt-6 inline-flex cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90"
      >
        Update your profile
      </Link>
    </div>
  );
}

/**
 * Profile is usable but nothing on the current board cleared the relevance
 * bar. This is NOT the same state as "profile_incomplete" and must not be
 * phrased as a profile-completion nudge.
 */
function NoMatchesYet({ variant }: { variant: "dashboard" | "page" }) {
  if (variant === "dashboard") {
    return (
      <p className="text-sm text-ink/45">
        Nothing on the board matches your profile right now.{" "}
        <Link href="/jobs" className="font-semibold text-marigold hover:underline">
          Browse all jobs
        </Link>{" "}
        or{" "}
        <Link href="/seeker/job-alerts" className="font-semibold text-marigold hover:underline">
          set up a job alert
        </Link>{" "}
        to hear about new fits.
      </p>
    );
  }

  return (
    <div className="py-16 text-center animate-slide-up">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.04]">
        <Sparkles className="h-8 w-8 text-ink/20" aria-hidden="true" />
      </div>
      <h2 className="mt-5 font-display text-lg font-bold text-ink">No matches on the board right now</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-ink/50">
        Your profile is in good shape — nothing currently posted lines up closely enough. Try
        browsing everything that&rsquo;s open, or set up an alert so we can tell you the moment a
        fit appears.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/jobs"
          className="inline-flex cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90"
        >
          Browse jobs
        </Link>
        <Link
          href="/seeker/job-alerts"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/65 transition hover:border-navy/30 hover:text-navy"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          Set up an alert
        </Link>
      </div>
    </div>
  );
}

export default function RecommendedJobsSection({ recommendations, variant, savedJobIds }: Props) {
  const isDashboard = variant === "dashboard";
  const hasItems = recommendations.status === "ok" && recommendations.items.length > 0;
  const savedSet = new Set(savedJobIds);

  if (isDashboard) {
    return (
      <section aria-labelledby="recommended-heading">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-marigold" aria-hidden="true" />
            <h2 id="recommended-heading" className="font-display text-base font-bold text-ink">
              Recommended for you
            </h2>
          </div>
          {hasItems && (
            <Link
              href="/seeker/recommended"
              className="flex items-center gap-0.5 text-xs font-semibold text-ink/40 transition hover:text-navy"
            >
              See all matches
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}
        </div>

        {recommendations.status === "profile_incomplete" ? (
          <ProfileIncompletePrompt variant="dashboard" />
        ) : recommendations.items.length === 0 ? (
          <NoMatchesYet variant="dashboard" />
        ) : (
          <ul className="divide-y divide-ink/5">
            {recommendations.items.map((job) => (
              <RecommendedJobCard key={job.id} job={job} saved={savedSet.has(job.id)} compact />
            ))}
          </ul>
        )}
      </section>
    );
  }

  // variant === "page"
  // The match count is deliberately NOT repeated here — SeekerNavBandBleed
  // already carries it as a badge on this page (same as /seeker/saved-jobs).
  // Showing the same number twice in two treatments is the duplicate-metric
  // pattern Phase B2 removed from the profile page; don't reintroduce it.
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Recommended for you</h1>
        <p className="mt-1.5 text-sm text-ink/50">
          Ranked by fit with your skills, headline, location, salary target, and availability.
        </p>
      </div>

      {recommendations.status === "profile_incomplete" ? (
        <ProfileIncompletePrompt variant="page" />
      ) : recommendations.items.length === 0 ? (
        <NoMatchesYet variant="page" />
      ) : (
        <ul className="divide-y divide-ink/8 animate-slide-up">
          {recommendations.items.map((job) => (
            <RecommendedJobCard key={job.id} job={job} saved={savedSet.has(job.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
