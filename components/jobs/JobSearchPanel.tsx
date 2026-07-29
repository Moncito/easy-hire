"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2, SlidersHorizontal, X } from "lucide-react";
import JobListingCard, { type JobCardData } from "@/components/jobs/JobListingCard";

const employmentOptions = [
  { value: "", label: "Any type" },
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
];

const remoteOptions = [
  { value: "", label: "Any setup" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-marigold/40 bg-marigold/15 text-[#8a5a10]"
          : "border-navy/10 bg-white text-ink/60 hover:border-navy/25 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function JobSearchPanel() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(
    async (opts: { append?: boolean; searchCursor?: string | null; q?: string } = {}) => {
      const searchQ = opts.q ?? committedQuery;
      const params = new URLSearchParams();
      if (searchQ) params.set("q", searchQ);
      if (category) params.set("category", category);
      if (employmentType) params.set("employmentType", employmentType);
      if (remoteType) params.set("remoteType", remoteType);
      if (opts.searchCursor) params.set("cursor", opts.searchCursor);

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load jobs");
      }

      const nextJobs: JobCardData[] = data.jobs ?? [];

      setCategories(data.categories ?? []);
      setNextCursor(data.nextCursor ?? null);
      setJobs((prev) => (opts.append ? [...prev, ...nextJobs] : nextJobs));
    },
    [committedQuery, category, employmentType, remoteType]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
      setCursor(null);
      try {
        await fetchJobs();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load jobs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchJobs]);

  useEffect(() => {
    if (session?.user?.role !== "SEEKER") return;
    fetch("/api/applications/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.jobIds) setAppliedIds(new Set(data.jobIds as string[]));
      })
      .catch(() => {});
  }, [session?.user?.role]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const nextQuery = query.trim();
    setCommittedQuery(nextQuery);
    setLoading(true);
    setError("");
    try {
      await fetchJobs({ q: nextQuery });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchJobs({ append: true, searchCursor: nextCursor });
      setCursor(nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  const activeFilterCount = [category, employmentType, remoteType].filter(Boolean).length;

  const filterForm = (
    <form onSubmit={handleSearch} className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          id="job-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Role, skill, company..."
          className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/20"
        />
      </div>

      <FilterGroup label="Category">
        <Chip active={!category} onClick={() => setCategory("")}>
          All
        </Chip>
        {categories.map((cat) => (
          <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
            {cat}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Employment type">
        {employmentOptions.map((opt) => (
          <Chip
            key={opt.value || "any-emp"}
            active={employmentType === opt.value}
            onClick={() => setEmploymentType(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup label="Work setup">
        {remoteOptions.map((opt) => (
          <Chip
            key={opt.value || "any-remote"}
            active={remoteType === opt.value}
            onClick={() => setRemoteType(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </FilterGroup>

      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-xl bg-marigold py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-marigold/90 disabled:opacity-60"
      >
        {loading ? "Searching..." : "Search jobs"}
      </button>
    </form>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-12">
      {/* Sticky filter sidebar */}
      <aside className="lg:sticky lg:top-[5.75rem] lg:z-20 lg:self-start">
        <div className="rounded-2xl border border-navy/8 bg-white/95 p-5 shadow-[0_8px_30px_rgba(30,58,95,0.05)] backdrop-blur-md sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink">Filters</h2>
              {activeFilterCount > 0 && (
                <p className="mt-0.5 text-xs text-ink/45">
                  {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-navy/10 px-3 py-1.5 text-xs font-semibold text-ink/70 lg:hidden"
            >
              {filtersOpen ? <X className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
              {filtersOpen ? "Close" : "Open"}
            </button>
          </div>
          <div className={`${filtersOpen ? "block" : "hidden"} lg:block`}>{filterForm}</div>
        </div>
      </aside>

      {/* Job results */}
      <div className="mt-8 min-w-0 lg:mt-0">
        {error && (
          <div className="mb-5 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-ink/45">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-navy/8 bg-white p-14 text-center sm:p-16">
            <h2 className="font-display text-xl font-bold text-ink">No jobs found</h2>
            <p className="mt-2 text-sm text-ink/50">
              Try different filters or check back soon for new VA roles.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-5 font-data text-sm text-ink/50">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
              {cursor ? " (showing more)" : ""}
            </p>
            <div className="grid grid-cols-1 gap-5 xl:gap-6">
              {jobs.map((job) => (
                <JobListingCard key={job.id} job={job} applied={appliedIds.has(job.id)} />
              ))}
            </div>
            {nextCursor && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="cursor-pointer rounded-full border border-navy/15 bg-white px-8 py-3 text-sm font-semibold text-ink/70 transition hover:border-navy/30 hover:bg-mist disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more jobs"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
