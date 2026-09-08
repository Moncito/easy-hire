import Link from "next/link";
import { Sparkles, ChevronRight, Bell } from "lucide-react";
import { formatEnumLabel } from "@/lib/shared/format";
import type { RecommendationSignal, RecommendedJob, SeekerRecommendations } from "@/lib/seeker/job-recommendations";
import RecommendedJobCard, { MATCH_BANDS, matchBand } from "@/components/seeker/RecommendedJobCard";
import MatchSignalsRow from "@/components/seeker/MatchSignalsRow";

type Props = {
  recommendations: SeekerRecommendations;
  variant: "dashboard" | "page";
  savedJobIds: string[];
  /** page-variant only: the validated `?filter=` value (already checked against `recommendedFilterIds`). Defaults to "all". */
  filter?: string;
};

export const RECOMMENDED_FILTER_ALL = "all";
export const RECOMMENDED_FILTER_REMOTE = "remote";

/** Distinct `employmentType` values actually present in this seeker's result set, sorted for a stable pill order. */
export function distinctEmploymentTypes(items: RecommendedJob[]): string[] {
  return Array.from(new Set(items.map((i) => i.employmentType))).sort();
}

/**
 * The full set of valid `?filter=` values for the current result set —
 * "all", "remote", plus one entry per employment type actually present.
 * Never hardcoded: a type that doesn't appear on the board never gets a pill.
 */
export function recommendedFilterIds(items: RecommendedJob[]): string[] {
  return [RECOMMENDED_FILTER_ALL, RECOMMENDED_FILTER_REMOTE, ...distinctEmploymentTypes(items)];
}

export function filterRecommendedItems(items: RecommendedJob[], filter: string): RecommendedJob[] {
  if (filter === RECOMMENDED_FILTER_REMOTE) return items.filter((j) => j.remoteType === "REMOTE");
  if (filter === RECOMMENDED_FILTER_ALL) return items;
  return items.filter((j) => j.employmentType === filter);
}

/**
 * Filter pills are sentence-cased ("Full time"), unlike the card's own
 * employment-type chip, which is styled `uppercase` and so can render
 * `formatEnumLabel`'s raw "FULL TIME" directly. These pills sit beside
 * "All" and "Remote" with no uppercase styling, so the raw enum casing
 * would read as shouting next to them.
 */
function filterLabel(id: string): string {
  if (id === RECOMMENDED_FILTER_ALL) return "All";
  if (id === RECOMMENDED_FILTER_REMOTE) return "Remote";
  const words = formatEnumLabel(id).toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const SIGNAL_COPY_LABELS: Record<RecommendationSignal["key"], string> = {
  skills: "skills",
  headline: "headline",
  location: "location",
  salary: "desired salary range",
  availability: "availability",
};

/** The three fields the cold-start gate always requires to be absent — used only as a fallback if every signal somehow reports present. */
const FALLBACK_ABSENT_LABELS = ["skills", "headline", "desired salary range"];

function absentSignalLabels(signals: RecommendationSignal[]): string[] {
  const absent = signals.filter((s) => !s.present).map((s) => SIGNAL_COPY_LABELS[s.key]);
  return absent.length > 0 ? absent : FALLBACK_ABSENT_LABELS;
}

/** Renders a list of bolded field names joined with commas and a trailing "and". */
function BoldFieldList({ labels }: { labels: string[] }) {
  return (
    <>
      {labels.map((label, i) => {
        const isLast = i === labels.length - 1;
        const separator = i === 0 ? "" : isLast ? (labels.length > 2 ? ", and " : " and ") : ", ";
        return (
          <span key={label}>
            {separator}
            <span className="font-semibold text-ink/70">{label}</span>
          </span>
        );
      })}
    </>
  );
}

/**
 * The seeker's profile is missing the fields the scorer needs — named
 * directly from `signals` so the copy never drifts from what the backend
 * actually gates on. Falls back to the original generic three-field phrasing
 * only if every signal somehow reports present in this state (shouldn't
 * happen given the cold-start gate, but guards against an empty sentence).
 */
function ProfileIncompletePrompt({
  variant,
  signals,
}: {
  variant: "dashboard" | "page";
  signals: RecommendationSignal[];
}) {
  const labels = absentSignalLabels(signals);

  if (variant === "dashboard") {
    return (
      <p className="text-sm text-ink/50">
        Add your <BoldFieldList labels={labels} /> to your profile so we can start matching you with
        roles.{" "}
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
        Matches are built from your profile — right now we&rsquo;re missing{" "}
        <BoldFieldList labels={labels} />. Fill those in and matches will start showing up here.
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

export default function RecommendedJobsSection({
  recommendations,
  variant,
  savedJobIds,
  filter = RECOMMENDED_FILTER_ALL,
}: Props) {
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
          <ProfileIncompletePrompt variant="dashboard" signals={recommendations.signals} />
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
  const items = recommendations.status === "ok" ? recommendations.items : [];
  const filterIds = recommendedFilterIds(items);
  const showFilterPills = items.length >= 4;
  const filteredItems = filterRecommendedItems(items, filter);
  const groups = MATCH_BANDS.map((band) => ({
    band,
    jobs: filteredItems.filter((job) => matchBand(job.score).key === band.key),
  })).filter((g) => g.jobs.length > 0);

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Recommended for you</h1>
        <p className="mt-1.5 text-sm text-ink/50">
          Ranked by fit with your skills, headline, location, salary target, and availability.
        </p>
      </div>

      {recommendations.status === "ok" && (
        <MatchSignalsRow signals={recommendations.signals} />
      )}

      {recommendations.status === "profile_incomplete" ? (
        <ProfileIncompletePrompt variant="page" signals={recommendations.signals} />
      ) : items.length === 0 ? (
        <NoMatchesYet variant="page" />
      ) : (
        <div className="space-y-6 animate-slide-up">
          {showFilterPills && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter matches">
              {filterIds.map((id) => {
                const active = filter === id;
                const href = id === RECOMMENDED_FILTER_ALL ? "/seeker/recommended" : `/seeker/recommended?filter=${id}`;
                return (
                  <Link
                    key={id}
                    href={href}
                    aria-current={active ? "true" : undefined}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-navy text-mist"
                        : "bg-ink/[0.05] text-ink/55 hover:bg-ink/10 hover:text-ink/75"
                    }`}
                  >
                    {filterLabel(id)}
                  </Link>
                );
              })}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <p className="text-sm text-ink/45">
              No matches for this filter.{" "}
              <Link href="/seeker/recommended" className="font-semibold text-marigold hover:underline">
                Clear filter
              </Link>
            </p>
          ) : (
            <div className="space-y-8">
              {groups.map((group) => (
                <section key={group.band.key} aria-labelledby={`match-group-${group.band.key}`}>
                  <h2
                    id={`match-group-${group.band.key}`}
                    className="mb-1 font-display text-lg font-bold text-ink"
                  >
                    {group.band.heading}{" "}
                    <span className="font-data text-sm font-normal text-ink/40">
                      ({group.jobs.length})
                    </span>
                  </h2>
                  <ul className="divide-y divide-ink/8" aria-labelledby={`match-group-${group.band.key}`}>
                    {group.jobs.map((job) => (
                      <RecommendedJobCard
                        key={job.id}
                        job={job}
                        saved={savedSet.has(job.id)}
                        scoreDisplay="number"
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
