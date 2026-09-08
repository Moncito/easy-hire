import Link from "next/link";
import { Tags, FileText, MapPin, Wallet, CalendarClock, Check } from "lucide-react";
import type { RecommendationSignal } from "@/lib/seeker/job-recommendations";

/**
 * "What shapes your matches" — surfaces which of the seeker's own profile
 * inputs the deterministic scorer is actually using, and links straight to
 * the fix for anything absent.
 *
 * Deliberately NOT a completeness score: no percentage, no ratio, no
 * progress bar (that metaphor belongs to ProfileStrengthNudge /
 * lib/seeker/profile-completion.ts — Phase B2 killed a duplicated
 * completeness metric on the profile page and this must not reintroduce
 * one). Discrete chips only, framed as ranking inputs rather than "how
 * complete you are". Also doesn't imply an employer has seen anything —
 * this is local ranking, nothing more.
 */

const SIGNAL_META: Record<RecommendationSignal["key"], { label: string; icon: typeof Tags }> = {
  skills: { label: "Skills", icon: Tags },
  headline: { label: "Headline", icon: FileText },
  location: { label: "Location", icon: MapPin },
  salary: { label: "Salary target", icon: Wallet },
  availability: { label: "Availability", icon: CalendarClock },
};

export default function MatchSignalsRow({ signals }: { signals: RecommendationSignal[] }) {
  const allPresent = signals.every((s) => s.present);

  // Quiet when there's nothing to act on — a row of five green ticks would
  // demand attention for no reason.
  if (allPresent) {
    return (
      <p className="text-xs text-ink/45">
        <Check className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-marigold" aria-hidden="true" />
        Your full profile is shaping these matches — skills, headline, location, salary target, and
        availability.
      </p>
    );
  }

  // Signals arrive weight-descending, so the first absent one is the
  // highest-value ask.
  const topAbsent = signals.find((s) => !s.present) ?? null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40">
        What shapes your matches
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Profile inputs used to rank your matches">
        {signals.map((signal) => {
          const meta = SIGNAL_META[signal.key];
          const Icon = meta.icon;

          if (signal.present) {
            return (
              <li key={signal.key}>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/15 px-3 py-1 text-xs font-semibold text-[#8a5a10]">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {meta.label}
                </span>
              </li>
            );
          }

          return (
            <li key={signal.key}>
              <Link
                href="/seeker/profile"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink/[0.05] px-3 py-1 text-xs font-semibold text-ink/45 transition hover:bg-ink/10 hover:text-ink/65"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                Add {meta.label.toLowerCase()}
              </Link>
            </li>
          );
        })}
      </ul>
      {topAbsent && (
        <p className="text-xs text-ink/45">
          Adding your{" "}
          <span className="font-semibold text-ink/65">
            {SIGNAL_META[topAbsent.key].label.toLowerCase()}
          </span>{" "}
          will sharpen these the most.{" "}
          <Link href="/seeker/profile" className="font-semibold text-marigold hover:underline">
            Update your profile
          </Link>
        </p>
      )}
    </div>
  );
}
