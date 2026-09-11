"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, RefreshCcw, Search } from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import { formatDate, titleCaseFromConstant } from "./badges";
import { fetchJobDirectoryPage } from "./api";
import { ADMIN_JOB_DIRECTORY_STATUSES, type JobStatus, type SerializedJobDirectoryItem } from "./types";

/**
 * `/admin/jobs/directory` — all jobs, any status, searchable, cursor-
 * paginated (docs/ADMIN-CONSOLE-PLAN.md §3). Deliberately distinct from the
 * risk-ranked moderation queue at `/admin/queues/jobs` — this is a plain
 * browse-and-search screen with no ranking, and it is the only surface that
 * ever shows CLOSED or never-submitted DRAFT jobs.
 *
 * There is no per-job detail page in this phase (see the module's page.tsx
 * doc comment) — a row's primary link goes to its employer's 360-degree
 * company record at `/admin/companies/[companyId]`, which is where "who
 * posted this and what else have they posted" actually gets answered.
 */

const STATUS_TABS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  ...ADMIN_JOB_DIRECTORY_STATUSES.map((s) => ({ value: s, label: titleCaseFromConstant(s) })),
];

const STATUS_STYLE: Record<JobStatus, string> = {
  DRAFT: "bg-ink/8 text-ink/60",
  PENDING_REVIEW: "bg-marigold/15 text-[#8a5a10]",
  ACTIVE: "bg-teal/10 text-teal",
  CLOSED: "bg-ink/8 text-ink/45",
};

function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}>
      {titleCaseFromConstant(status)}
    </span>
  );
}

const SALARY_PERIOD_SUFFIX: Record<string, string> = { HOURLY: "/hr", MONTHLY: "/mo", ANNUAL: "/yr" };

function formatSalary(min: number | null, max: number | null, period: string): string {
  if (min === null && max === null) return "—";
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const range = min !== null && max !== null ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max)!);
  return `₱${range}${SALARY_PERIOD_SUFFIX[period] ?? ""}`;
}

export type JobDirectoryProps = {
  initialItems: SerializedJobDirectoryItem[];
  initialNextCursor: string | null;
  initialSearch?: string;
};

export default function JobDirectory({ initialItems, initialNextCursor, initialSearch = "" }: JobDirectoryProps) {
  const [status, setStatus] = useState<JobStatus | "">("");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const [items, setItems] = useState<SerializedJobDirectoryItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(initialNextCursor);
  const didMountRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function loadPage(reset: boolean) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchJobDirectoryPage(
        {
          status: status || undefined,
          search: debouncedSearch || undefined,
          cursor: reset ? undefined : nextCursorRef.current,
          limit: 25,
        },
        controller.signal
      );
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setNextCursor(res.nextCursor);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load the job directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch]);

  const columns: DataTableColumn<SerializedJobDirectoryItem>[] = [
    {
      key: "job",
      header: "Job",
      render: (row) => (
        <div className="max-w-sm">
          <p className="truncate font-medium text-ink">{row.title}</p>
          <p className="truncate text-xs text-ink/45">{row.companyName}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "category",
      header: "Category",
      render: (row) => <span className="text-xs text-ink/60">{row.category}</span>,
    },
    {
      key: "salary",
      header: "Salary",
      align: "right",
      render: (row) => (
        <span className="font-data text-xs text-ink/60">{formatSalary(row.salaryMin, row.salaryMax, row.salaryPeriod)}</span>
      ),
    },
    {
      key: "updated",
      header: "Updated",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55">{formatDate(row.updatedAt)}</span>,
    },
  ];

  const hasFilters = status !== "" || debouncedSearch !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="job-status-filter" className="sr-only">
          Filter by job status
        </label>
        <select
          id="job-status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as JobStatus | "")}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink/70 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        >
          {STATUS_TABS.map((tab) => (
            <option key={tab.value || "all"} value={tab.value}>
              {tab.label}
            </option>
          ))}
        </select>

        <label htmlFor="job-search" className="sr-only">
          Search jobs by title, category or company
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" aria-hidden="true" />
          <input
            id="job-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, category or company…"
            className="w-72 rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-ember/20 bg-ember/5 py-12 text-center">
          <p className="text-sm text-ember">{error}</p>
          <button
            type="button"
            onClick={() => void loadPage(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ember/30 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/10"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={items}
            getRowId={(row) => row.id}
            getRowHref={(row) => `/admin/companies/${row.companyId}`}
            getRowAriaLabel={(row) => `Open ${row.companyName}, the employer behind "${row.title}"`}
            caption="Admin job directory: every job, any status, with the employer that posted it"
            loading={loading}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
                <Briefcase className="h-6 w-6 text-ink/30" aria-hidden="true" />
                <p className="font-display text-base font-bold text-ink">
                  {hasFilters ? "No jobs match these filters" : "No jobs yet"}
                </p>
                <p className="max-w-xs text-sm text-ink/50">
                  {hasFilters ? "Try a different status or search term." : "Jobs will appear here once employers post them."}
                </p>
              </div>
            }
          />

          {nextCursor && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadPage(false)}
                className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/65 hover:bg-ink/5 disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-center text-[11px] text-ink/35">
        A row opens the employer&rsquo;s full company record — there is no standalone job detail page yet.
      </p>
    </div>
  );
}
