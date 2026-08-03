"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bookmark, MapPin, Search, Wallet, Clock } from "lucide-react";
import { formatEnumLabel, formatPesoRange, type SalaryPeriod } from "@/lib/format";
import { timeAgo } from "@/lib/time-ago";
import SaveJobButton from "@/components/jobs/SaveJobButton";
import type { JobCardData } from "@/components/jobs/JobListingCard";

export type SavedJobEntry = {
  savedAt: string;
  job: JobCardData;
};

type FilterId = "ALL" | "REMOTE" | "VERIFIED" | string;

type Props = {
  initialSaved: SavedJobEntry[];
  appliedJobIds: string[];
};

function companyInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SavedJobsPanel({ initialSaved, appliedJobIds }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("ALL");

  const appliedSet = useMemo(() => new Set(appliedJobIds), [appliedJobIds]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const s of saved) {
      if (s.job.category) set.add(s.job.category);
    }
    return Array.from(set).sort();
  }, [saved]);

  const filters: { id: FilterId; label: string }[] = useMemo(
    () => [
      { id: "ALL", label: "All" },
      ...categories.slice(0, 3).map((c) => ({ id: c, label: c })),
      { id: "REMOTE", label: "Remote" },
      { id: "VERIFIED", label: "Verified" },
    ],
    [categories]
  );

  const visible = useMemo(() => {
    let list = saved;
    const q = query.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (s) =>
          s.job.title.toLowerCase().includes(q) ||
          s.job.company.companyName.toLowerCase().includes(q) ||
          s.job.category.toLowerCase().includes(q) ||
          s.job.location.toLowerCase().includes(q)
      );
    }

    if (filter === "REMOTE") {
      list = list.filter((s) => s.job.remoteType === "REMOTE");
    } else if (filter === "VERIFIED") {
      list = list.filter((s) => s.job.company.verifiedStatus === "APPROVED");
    } else if (filter !== "ALL") {
      list = list.filter((s) => s.job.category === filter);
    }

    return list;
  }, [saved, query, filter]);

  function handleUnsave(jobId: string, nextSaved: boolean) {
    if (nextSaved) return;
    setSaved((prev) => prev.filter((s) => s.job.id !== jobId));
  }

  const countLabel =
    saved.length === 1 ? "1 Saved Role" : `${saved.length} Saved Roles`;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Saved jobs</h1>
          {saved.length > 0 && (
            <span className="rounded-full bg-ink/[0.06] px-3 py-1 text-xs font-semibold text-ink/55">
              {countLabel}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-ink/50">
          Your shortlist — come back anytime to apply.
        </p>
      </div>

      {saved.length > 0 && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block lg:max-w-md lg:flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved jobs..."
              className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition focus:border-navy/25 focus:ring-2 focus:ring-navy/10"
            />
          </label>

          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-navy text-mist"
                      : "bg-ink/[0.05] text-ink/55 hover:bg-ink/10 hover:text-ink/75"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {saved.length === 0 ? (
        <div className="py-16 text-center animate-slide-up">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.04]">
            <Bookmark className="h-8 w-8 text-ink/20" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-lg font-bold text-ink">No saved jobs yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink/50">
            Tap the bookmark icon on any listing to save it here for later.
          </p>
          <Link
            href="/jobs"
            className="mt-6 inline-flex cursor-pointer rounded-xl bg-marigold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90"
          >
            Browse jobs
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/45">No saved jobs match your search.</p>
      ) : (
        <ul className="divide-y divide-ink/8 animate-slide-up">
          {visible.map((entry, idx) => {
            const { job } = entry;
            const applied = appliedSet.has(job.id);
            const postedAt = job.publishedAt ?? job.createdAt ?? null;
            const verified = job.company.verifiedStatus === "APPROVED";

            return (
              <li
                key={job.id}
                className="group flex flex-col gap-4 py-5 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-center sm:gap-6"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  {job.company.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.company.logoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-ink/8"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy">
                      {companyInitials(job.company.companyName)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-display text-base font-bold text-ink transition hover:text-navy sm:text-lg"
                      >
                        {job.title}
                      </Link>
                      {verified && (
                        <span className="rounded-md bg-teal/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink/50">{job.company.companyName}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 sm:max-w-md">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-marigold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a5a10]">
                      {job.category}
                    </span>
                    <span className="rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/50">
                      {formatEnumLabel(job.employmentType)}
                    </span>
                    <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
                      {formatEnumLabel(job.remoteType)}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/45">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1 font-data font-medium text-ink/60">
                      <Wallet className="h-3 w-3" aria-hidden="true" />
                      {formatPesoRange(
                        job.salaryMin,
                        job.salaryMax,
                        (job.salaryPeriod as SalaryPeriod) || "MONTHLY"
                      )}
                    </span>
                    {postedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {timeAgo(postedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <SaveJobButton jobId={job.id} saved onToggle={handleUnsave} />
                  {applied ? (
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex cursor-pointer rounded-full border border-ink/15 bg-white px-4 py-2 text-xs font-semibold text-ink/70 transition hover:border-navy/25 hover:text-navy"
                    >
                      View details
                    </Link>
                  ) : (
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex cursor-pointer rounded-full bg-navy px-4 py-2 text-xs font-semibold text-mist transition hover:bg-navy/90"
                    >
                      Quick apply
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
