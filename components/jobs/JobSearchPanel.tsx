"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Loader2 } from "lucide-react";
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

export default function JobSearchPanel() {
  const [query, setQuery] = useState("");
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

  const fetchJobs = useCallback(
    async (opts: { append?: boolean; searchCursor?: string | null } = {}) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (employmentType) params.set("employmentType", employmentType);
      if (remoteType) params.set("remoteType", remoteType);
      if (opts.searchCursor) params.set("cursor", opts.searchCursor);

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load jobs");
      }

      setCategories(data.categories ?? []);
      setNextCursor(data.nextCursor ?? null);
      setJobs((prev) => (opts.append ? [...prev, ...(data.jobs ?? [])] : data.jobs ?? []));
    },
    [query, category, employmentType, remoteType]
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    setCursor(null);
    fetchJobs()
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, [fetchJobs]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await fetchJobs();
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

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="h-fit rounded-2xl border border-ink/5 bg-white p-5 shadow-xs lg:sticky lg:top-24">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="job-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
              <input
                id="job-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Role, skill, company..."
                className="w-full rounded-xl border border-ink/10 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none focus:border-teal"
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="employmentType" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Employment
            </label>
            <select
              id="employmentType"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none focus:border-teal"
            >
              {employmentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="remoteType" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Work setup
            </label>
            <select
              id="remoteType"
              value={remoteType}
              onChange={(e) => setRemoteType(e.target.value)}
              className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm outline-none focus:border-teal"
            >
              {remoteOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:opacity-60"
          >
            {loading ? "Searching..." : "Search jobs"}
          </button>
        </form>
      </aside>

      <div>
        {error && (
          <div className="mb-4 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-ink/45">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-xs">
            <h2 className="font-display text-lg font-bold text-ink">No jobs found</h2>
            <p className="mt-2 text-sm text-ink/50">Try different filters or check back soon for new VA roles.</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink/50">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} found
              {cursor ? " (showing more)" : ""}
            </p>
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <JobListingCard key={job.id} job={job} />
              ))}
            </div>
            {nextCursor && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-ink/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/3 disabled:opacity-60"
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
