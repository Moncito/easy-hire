"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  CheckCircle2,
  Clock,
  PenLine,
  RefreshCcw,
  Search,
} from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import { formatDate, titleCaseFromConstant } from "./badges";
import { StatTile } from "@/components/admin/statTiles";
import JobPostingTrendChart from "./JobPostingTrendChart";
import { fetchJobDirectoryPage } from "./api";
import {
  ADMIN_JOB_DIRECTORY_STATUSES,
  type JobStatus,
  type SerializedJobDirectoryItem,
  type SerializedJobDirectoryStats,
  type SerializedJobPostingTrendPoint,
} from "./types";

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
 *
 * Layout mirrors `UserDirectory.tsx`: a whole-platform stat/trend band above
 * a pill-filtered, sortable table.
 */

const STATUS_TABS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  ...ADMIN_JOB_DIRECTORY_STATUSES.map((s) => ({ value: s, label: titleCaseFromConstant(s) })),
];

/**
 * Same hue choices as before this pass (marigold/pending-review,
 * teal/active, muted ink/gray for draft+closed) — CLAUDE.md's job-status
 * precedent is kept as-is, just given `admin-dark:` variants following
 * `RoleBadge`/`VerifiedBadge`'s own pattern in badges.tsx: PENDING_REVIEW
 * mirrors ROLE_STYLE.SEEKER's marigold swap, ACTIVE mirrors
 * ROLE_STYLE.EMPLOYER's teal swap (no text-color override needed — teal is
 * already a high-contrast accent in both themes), and DRAFT/CLOSED both move
 * off `bg-ink/8`/`text-ink/*` (which goes muddy on a near-black surface) onto
 * `bg-white/10`/`text-mist/*`, keeping DRAFT slightly more prominent than
 * CLOSED the same way the light-mode pair does (ink/60 vs ink/45).
 */
const STATUS_STYLE: Record<JobStatus, string> = {
  DRAFT: "bg-ink/8 text-ink/60 admin-dark:bg-white/10 admin-dark:text-mist/65",
  PENDING_REVIEW: "bg-marigold/15 text-[#8a5a10] admin-dark:bg-marigold/20 admin-dark:text-marigold",
  ACTIVE: "bg-teal/10 text-teal admin-dark:bg-teal/15",
  CLOSED: "bg-ink/8 text-ink/45 admin-dark:bg-white/10 admin-dark:text-mist/45",
};

/** Icon + text for every status, never colour alone — same convention as `RoleBadge`/`VerifiedBadge` in badges.tsx. */
const STATUS_ICON: Record<JobStatus, typeof PenLine> = {
  DRAFT: PenLine,
  PENDING_REVIEW: Clock,
  ACTIVE: CheckCircle2,
  CLOSED: Archive,
};

function StatusPill({ status }: { status: JobStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status]}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {titleCaseFromConstant(status)}
    </span>
  );
}

/** Filter-pill class factory — same visual language as `UserDirectory.tsx`'s `pillTabClassName`, kept local since the two directories don't share a component module. */
function pillTabClassName(active: boolean): string {
  return `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:focus-visible:ring-teal ${
    active
      ? "bg-navy text-white admin-dark:bg-teal"
      : "text-ink/55 hover:bg-ink/5 admin-dark:text-mist/55 admin-dark:hover:bg-white/10"
  }`;
}

const SALARY_PERIOD_SUFFIX: Record<string, string> = { HOURLY: "/hr", MONTHLY: "/mo", ANNUAL: "/yr" };

function formatSalary(min: number | null, max: number | null, period: string): string {
  if (min === null && max === null) return "—";
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const range = min !== null && max !== null ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max)!);
  return `₱${range}${SALARY_PERIOD_SUFFIX[period] ?? ""}`;
}

/** Representative single number for sorting a min/max range — the higher bound when both exist, whichever bound exists otherwise, `null` when neither does. */
function salarySortValue(row: SerializedJobDirectoryItem): number | null {
  if (row.salaryMax !== null) return row.salaryMax;
  if (row.salaryMin !== null) return row.salaryMin;
  return null;
}

type SortKey = "salary" | "updated";
type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

/** Client-side re-sort of the currently-loaded page only — same contract as `UserDirectory.tsx`'s Trust/Joined sort, no server-side multi-column sort. */
function SortableHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onToggle: (key: SortKey) => void;
}) {
  const dir = sort && sort.key === sortKey ? sort.dir : null;
  const active = dir !== null;
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      aria-label={`Sort by ${label}${active ? (dir === "asc" ? ", currently ascending" : ", currently descending") : ""}`}
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink/45 transition-colors hover:text-ink admin-dark:text-mist/45 admin-dark:hover:text-mist"
    >
      {label}
      {dir === "asc" ? (
        <ArrowUp className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : dir === "desc" ? (
        <ArrowDown className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="h-3 w-3 shrink-0 opacity-40" aria-hidden="true" />
      )}
    </button>
  );
}

export type JobDirectoryProps = {
  initialItems: SerializedJobDirectoryItem[];
  initialNextCursor: string | null;
  initialSearch?: string;
  /**
   * Analytics band above the table — a whole-platform snapshot/trend,
   * unaffected by this component's own status/search filters. Same contract
   * as `UserDirectoryProps.stats`/`signupTrend`.
   */
  stats: SerializedJobDirectoryStats;
  postingTrend: SerializedJobPostingTrendPoint[];
};

export default function JobDirectory({
  initialItems,
  initialNextCursor,
  initialSearch = "",
  stats,
  postingTrend,
}: JobDirectoryProps) {
  const [status, setStatus] = useState<JobStatus | "">("");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sort, setSort] = useState<SortState>(null);

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

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  // Re-sorts only the rows already loaded on the client — never a
  // server-side request, so this stays correct even mid-pagination. Nulls
  // (no salary range given) always sort to the end, regardless of direction
  // — same "unknown sorts last" rule `UserDirectory.tsx` applies to a null
  // trust score.
  const displayedItems = useMemo(() => {
    if (!sort) return items;
    const sorted = [...items].sort((a, b) => {
      if (sort.key === "updated") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      const av = salarySortValue(a);
      const bv = salarySortValue(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av - bv;
    });
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [items, sort]);

  const columns: DataTableColumn<SerializedJobDirectoryItem>[] = [
    {
      key: "job",
      header: "Job",
      render: (row) => (
        <div className="max-w-sm">
          <p className="truncate font-medium text-ink admin-dark:text-mist">{row.title}</p>
          <p className="truncate text-xs text-ink/45 admin-dark:text-mist/45">{row.companyName}</p>
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
      render: (row) => <span className="text-xs text-ink/60 admin-dark:text-mist/60">{row.category}</span>,
    },
    {
      key: "salary",
      header: <SortableHeader label="Salary" sortKey="salary" sort={sort} onToggle={toggleSort} />,
      ariaSort: sort && sort.key === "salary" ? (sort.dir === "asc" ? "ascending" : "descending") : "none",
      align: "right",
      render: (row) => (
        <span className="font-data text-xs text-ink/60 admin-dark:text-mist/60">
          {formatSalary(row.salaryMin, row.salaryMax, row.salaryPeriod)}
        </span>
      ),
    },
    {
      key: "updated",
      header: <SortableHeader label="Updated" sortKey="updated" sort={sort} onToggle={toggleSort} />,
      ariaSort: sort && sort.key === "updated" ? (sort.dir === "asc" ? "ascending" : "descending") : "none",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55 admin-dark:text-mist/55">{formatDate(row.updatedAt)}</span>,
    },
  ];

  const hasFilters = status !== "" || debouncedSearch !== "";

  return (
    <div className="space-y-8">
      <section aria-labelledby="job-directory-snapshot-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="job-directory-snapshot-heading"
            className="font-display text-lg font-bold tracking-tight text-ink admin-dark:text-mist"
          >
            Platform snapshot
          </h2>
          <p className="text-xs text-ink/45 admin-dark:text-mist/45">Whole platform — not affected by the filters below</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label="Total jobs" value={stats.totalJobs.toLocaleString()} />
          <StatTile label="Draft" value={stats.draftCount.toLocaleString()} tone="muted" />
          <Link
            href="/admin/queues/jobs"
            className="rounded-xl transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold hover:shadow-[0_0_0_2px_rgba(242,169,59,0.4)]"
            aria-label={`Pending review: ${stats.pendingReviewCount.toLocaleString()} jobs. Open the risk-ranked approval queue.`}
          >
            <StatTile label="Pending review" value={stats.pendingReviewCount.toLocaleString()} tone="marigold" />
          </Link>
          <StatTile label="Active" value={stats.activeCount.toLocaleString()} tone="teal" />
          <StatTile label="Closed" value={stats.closedCount.toLocaleString()} tone="muted" />
        </div>
        <p className="text-xs text-ink/40 admin-dark:text-mist/40">
          Draft, pending review, active and closed sum to the total exactly — every job has exactly one status.{" "}
          <Link href="/admin/queues/jobs" className="font-semibold text-navy underline-offset-2 hover:underline admin-dark:text-teal">
            Open the risk-ranked approval queue
          </Link>{" "}
          to act on pending-review jobs.
        </p>

        <JobPostingTrendChart postingTrend={postingTrend} />
      </section>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter by job status"
            className="inline-flex flex-wrap rounded-xl border border-ink/10 bg-white p-1 admin-dark:border-white/10 admin-dark:bg-white/5"
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                aria-pressed={status === tab.value}
                onClick={() => setStatus(tab.value)}
                className={pillTabClassName(status === tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label htmlFor="job-search" className="sr-only">
            Search jobs by title, category or company
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30 admin-dark:text-mist/30"
              aria-hidden="true"
            />
            <input
              id="job-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, category or company…"
              className="w-72 rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/10 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/40 admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
            />
          </div>
        </div>

        <p className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-ink/45 admin-dark:text-mist/45">
          {hasFilters ? (
            <span>
              Showing <span className="font-data font-semibold text-ink admin-dark:text-mist">{items.length}</span> matching
              job{items.length === 1 ? "" : "s"} loaded
            </span>
          ) : (
            <span>
              Showing <span className="font-data font-semibold text-ink admin-dark:text-mist">{items.length}</span> of{" "}
              <span className="font-data font-semibold text-ink admin-dark:text-mist">{stats.totalJobs.toLocaleString()}</span>{" "}
              job{stats.totalJobs === 1 ? "" : "s"}
            </span>
          )}
        </p>

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
              rows={displayedItems}
              getRowId={(row) => row.id}
              getRowHref={(row) => `/admin/companies/${row.companyId}`}
              getRowAriaLabel={(row) => `Open ${row.companyName}, the employer behind "${row.title}"`}
              caption="Admin job directory: every job, any status, with the employer that posted it"
              loading={loading}
              emptyState={
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center admin-dark:border-white/10 admin-dark:bg-white/5">
                  <Briefcase className="h-6 w-6 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
                  <p className="font-display text-base font-bold text-ink admin-dark:text-mist">
                    {hasFilters ? "No jobs match these filters" : "No jobs yet"}
                  </p>
                  <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">
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
                  className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/65 hover:bg-ink/5 disabled:opacity-60 admin-dark:border-white/10 admin-dark:bg-white/5 admin-dark:text-mist/65 admin-dark:hover:bg-white/10"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}

        <p className="text-center text-[11px] text-ink/35 admin-dark:text-mist/35">
          A row opens the employer&rsquo;s full company record — there is no standalone job detail page yet.
        </p>
      </div>
    </div>
  );
}
