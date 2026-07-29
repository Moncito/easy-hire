"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2, SlidersHorizontal, X, MapPin } from "lucide-react";
import JobListingCard, { type JobCardData } from "@/components/jobs/JobListingCard";
import JobListRow from "@/components/jobs/JobListRow";
import JobDetailPanel from "@/components/jobs/JobDetailPanel";
import SaveSearchButton from "@/components/jobs/SaveSearchButton";
import { ROLE_TYPES, INDUSTRIES } from "@/lib/constants/job-categories";
import { periodSuffix, type SalaryPeriod } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

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

const salaryPeriodOptions: { value: SalaryPeriod; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "HOURLY", label: "Hourly" },
  { value: "ANNUAL", label: "Annual" },
];

const postedWithinOptions = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "salary_high", label: "Highest pay" },
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

const selectClass =
  "w-full rounded-xl border border-navy/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-marigold";

export default function JobSearchPanel() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>("MONTHLY");
  const [postedWithin, setPostedWithin] = useState("");
  const debouncedLocation = useDebouncedValue(location, 450);
  const debouncedSalaryMin = useDebouncedValue(salaryMin, 450);
  const debouncedSalaryMax = useDebouncedValue(salaryMax, 450);
  const [sort, setSort] = useState("newest");
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchJobs = useCallback(
    async (opts: { append?: boolean; searchCursor?: string | null; q?: string } = {}) => {
      const searchQ = opts.q ?? committedQuery;
      const params = new URLSearchParams();
      if (searchQ) params.set("q", searchQ);
      if (category) params.set("category", category);
      if (industry) params.set("industry", industry);
      if (debouncedLocation) params.set("location", debouncedLocation);
      if (employmentType) params.set("employmentType", employmentType);
      if (remoteType) params.set("remoteType", remoteType);
      if (debouncedSalaryMin) params.set("salaryMin", debouncedSalaryMin);
      if (debouncedSalaryMax) params.set("salaryMax", debouncedSalaryMax);
      if (debouncedSalaryMin || debouncedSalaryMax) params.set("salaryPeriod", salaryPeriod);
      if (postedWithin) params.set("postedWithin", postedWithin);
      if (sort !== "newest") params.set("sort", sort);
      if (opts.searchCursor) params.set("cursor", opts.searchCursor);

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load jobs");
      }

      const nextJobs: JobCardData[] = data.jobs ?? [];

      setNextCursor(data.nextCursor ?? null);
      setJobs((prev) => (opts.append ? [...prev, ...nextJobs] : nextJobs));
    },
    [
      committedQuery,
      category,
      industry,
      debouncedLocation,
      employmentType,
      remoteType,
      debouncedSalaryMin,
      debouncedSalaryMax,
      salaryPeriod,
      postedWithin,
      sort,
    ]
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
    fetch("/api/seeker/jobs/saved")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.jobIds) setSavedIds(new Set(data.jobIds as string[]));
      })
      .catch(() => {});
  }, [session?.user?.role]);

  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    if (!jobs.some((j) => j.id === selectedJobId)) {
      setSelectedJobId(jobs[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs]);

  function handleToggleSaved(jobId: string, nextSaved: boolean) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nextSaved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  }

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

  const activeFilterCount = [
    category,
    industry,
    location,
    employmentType,
    remoteType,
    salaryMin,
    salaryMax,
    postedWithin,
  ].filter(Boolean).length;

  const searchSummary = [committedQuery, category, location].filter(Boolean).join(" · ");
  const canSaveSearch = session?.user?.role === "SEEKER" && (committedQuery || activeFilterCount > 0);

  const filterForm = (
    <form onSubmit={handleSearch} className="space-y-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          id="job-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Role, skill, company, or keyword..."
          className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/20"
        />
      </div>

      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (e.g. Philippines, Cebu)"
          className="w-full rounded-xl border border-navy/10 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/20"
        />
      </div>

      <FilterGroup label="Role type">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">All role types</option>
          {ROLE_TYPES.map((rt) => (
            <option key={rt.slug} value={rt.label}>
              {rt.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup label="Industry">
        <select value={industry} onChange={(e) => setIndustry(e.target.value)} className={selectClass}>
          <option value="">All industries</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind.slug} value={ind.label}>
              {ind.label}
            </option>
          ))}
        </select>
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

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">Pay range (PHP)</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {salaryPeriodOptions.map((p) => (
            <Chip key={p.value} active={salaryPeriod === p.value} onClick={() => setSalaryPeriod(p.value)}>
              {p.label}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder={`Min${periodSuffix(salaryPeriod)}`}
            className="w-full rounded-xl border border-navy/10 px-3 py-2 font-data text-sm outline-none focus:border-marigold"
          />
          <input
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder={`Max${periodSuffix(salaryPeriod)}`}
            className="w-full rounded-xl border border-navy/10 px-3 py-2 font-data text-sm outline-none focus:border-marigold"
          />
        </div>
      </div>

      <FilterGroup label="Date posted">
        <select
          value={postedWithin}
          onChange={(e) => setPostedWithin(e.target.value)}
          className={selectClass}
        >
          {postedWithinOptions.map((opt) => (
            <option key={opt.value || "any-time"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="font-data text-sm text-ink/50">
                {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
                {cursor ? " (showing more)" : ""}
              </p>
              <div className="flex items-center gap-2">
                {canSaveSearch && (
                  <SaveSearchButton
                    key={`${searchSummary}-${category}-${industry}`}
                    keywords={searchSummary || "All VA jobs"}
                    category={category || industry || undefined}
                  />
                )}
                <label className="flex items-center gap-2 text-xs font-semibold text-ink/60">
                  Sort:
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="rounded-lg border border-navy/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-marigold"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            {/* Desktop split-view: row list left, live detail preview right. Filters stay visible in the sticky sidebar. */}
            <div className="hidden overflow-hidden rounded-2xl border border-navy/8 bg-white xl:flex xl:h-[calc(100vh-13rem)]">
              <div className="w-full max-w-[380px] shrink-0 overflow-y-auto divide-y divide-ink/5 border-r border-ink/5">
                {jobs.map((job) => (
                  <JobListRow
                    key={job.id}
                    job={job}
                    active={selectedJobId === job.id}
                    applied={appliedIds.has(job.id)}
                    saved={savedIds.has(job.id)}
                    onToggleSaved={handleToggleSaved}
                    onSelect={setSelectedJobId}
                  />
                ))}
                {nextCursor && (
                  <div className="p-4 text-center">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="cursor-pointer rounded-full border border-navy/15 bg-white px-5 py-2 text-xs font-semibold text-ink/70 transition hover:border-navy/30 hover:bg-mist disabled:opacity-60"
                    >
                      {loadingMore ? "Loading..." : "Load more jobs"}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {selectedJobId ? (
                  <JobDetailPanel
                    jobId={selectedJobId}
                    saved={savedIds.has(selectedJobId)}
                    onToggleSaved={handleToggleSaved}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink/40">
                    Select a job to preview
                  </div>
                )}
              </div>
            </div>

            {/* Mobile/tablet fallback: full card grid with real navigation. */}
            <div className="grid grid-cols-1 gap-5 xl:hidden">
              {jobs.map((job) => (
                <JobListingCard
                  key={job.id}
                  job={job}
                  applied={appliedIds.has(job.id)}
                  saved={savedIds.has(job.id)}
                  onToggleSaved={handleToggleSaved}
                />
              ))}
            </div>
            {nextCursor && (
              <div className="mt-10 text-center xl:hidden">
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
