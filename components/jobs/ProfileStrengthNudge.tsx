"use client";

import Link from "next/link";

type Props = {
  completed: number;
  total: number;
  firstIncomplete?: string | null;
  compact?: boolean;
};

export default function ProfileStrengthNudge({ completed, total, firstIncomplete, compact }: Props) {
  if (completed >= total) return null;

  const pct = Math.round((completed / total) * 100);
  const href = firstIncomplete ? `/seeker/profile?bucket=${firstIncomplete}` : "/seeker/profile";

  if (compact) {
    return (
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-full border border-marigold/25 bg-marigold/10 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a5a10]">Profile</p>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink/8 sm:w-28">
            <div className="h-full rounded-full bg-marigold transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-data text-xs font-semibold text-ink/70">
            {completed}/{total}
          </p>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 cursor-pointer items-center rounded-full bg-marigold px-3 py-1 text-[11px] font-semibold text-ink hover:bg-marigold/90"
        >
          Complete profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-marigold/25 bg-gradient-to-r from-marigold/12 via-marigold/8 to-transparent p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a5a10]">Profile strength</p>
          <p className="mt-1 font-display text-lg font-bold text-ink">
            {completed}/{total} sections complete — employers notice complete profiles
          </p>
          <div className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-ink/8">
            <div className="h-full rounded-full bg-marigold transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90"
        >
          Complete profile
        </Link>
      </div>
    </div>
  );
}
