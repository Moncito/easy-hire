"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCcw, Search, Users as UsersIcon } from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import { RoleBadge, VerifiedBadge, TrustScoreValue, formatDate } from "./badges";
import RelativeTime from "./RelativeTime";
import { StatTile } from "@/components/admin/statTiles";
import UserSignupTrendChart from "./UserSignupTrendChart";
import { fetchUserDirectoryPage } from "./api";
import type {
  Role,
  SerializedUserDirectoryItem,
  SerializedUserDirectoryStats,
  SerializedUserSignupTrendPoint,
  UserDirectoryVerifiedFilter,
} from "./types";

/**
 * `/admin/users` — the directory (docs/ADMIN-CONSOLE-PLAN.md §4.3 / §3):
 * every user, any role, searchable by email/name, filterable by role and
 * verified state, cursor-paginated. Rows link to the 360-degree record.
 *
 * Server component renders the first page (§5: "Server components for
 * reads") — this client shell never re-fetches that exact page on mount,
 * only on a subsequent filter/search change or "load more", same contract
 * as ReviewQueue.
 */

const ROLE_TABS: { value: Role | ""; label: string }[] = [
  { value: "", label: "All roles" },
  { value: "SEEKER", label: "Seekers" },
  { value: "EMPLOYER", label: "Employers" },
  { value: "ADMIN", label: "Admins" },
];

const VERIFIED_TABS: { value: UserDirectoryVerifiedFilter | ""; label: string }[] = [
  { value: "", label: "Any verification" },
  { value: "VERIFIED", label: "Verified" },
  { value: "UNVERIFIED", label: "Unverified" },
];

/** Filter-pill class factory shared by the role and verified-state groups so the two read as one visual language instead of two inconsistent controls. */
function pillTabClassName(active: boolean): string {
  return `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy admin-dark:focus-visible:ring-teal ${
    active
      ? "bg-navy text-white admin-dark:bg-teal"
      : "text-ink/55 hover:bg-ink/5 admin-dark:text-mist/55 admin-dark:hover:bg-white/10"
  }`;
}

type SortKey = "joined" | "trust";
type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

/** Client-side re-sort of the currently-loaded page only — the table is server-sorted by `createdAt desc` by default, and this never asks the server for a different order. */
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

export type UserDirectoryProps = {
  initialItems: SerializedUserDirectoryItem[];
  initialNextCursor: string | null;
  /**
   * Analytics band above the table — a whole-platform snapshot/trend,
   * unaffected by this component's own role/verified/search filters.
   */
  stats: SerializedUserDirectoryStats;
  signupTrend: SerializedUserSignupTrendPoint[];
};

export default function UserDirectory({
  initialItems,
  initialNextCursor,
  stats,
  signupTrend,
}: UserDirectoryProps) {
  const [role, setRole] = useState<Role | "">("");
  const [verified, setVerified] = useState<UserDirectoryVerifiedFilter | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const [items, setItems] = useState<SerializedUserDirectoryItem[]>(initialItems);
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
      const res = await fetchUserDirectoryPage(
        {
          role: role || undefined,
          verified: verified || undefined,
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
      setError(e instanceof Error ? e.message : "Failed to load the user directory.");
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
  }, [role, verified, debouncedSearch]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  }

  // Re-sorts only the rows already loaded on the client — never a
  // server-side request, so this stays correct even mid-pagination.
  const displayedItems = useMemo(() => {
    if (!sort) return items;
    const sorted = [...items].sort((a, b) => {
      if (sort.key === "joined") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.trustScore === null && b.trustScore === null) return 0;
      if (a.trustScore === null) return 1;
      if (b.trustScore === null) return -1;
      return a.trustScore - b.trustScore;
    });
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  }, [items, sort]);

  const columns: DataTableColumn<SerializedUserDirectoryItem>[] = [
    {
      key: "user",
      header: "User",
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium text-ink admin-dark:text-mist">{row.displayName ?? row.email}</p>
          {row.displayName && <p className="truncate text-xs text-ink/45 admin-dark:text-mist/45">{row.email}</p>}
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: "verified",
      header: "Verified",
      render: (row) => <VerifiedBadge verified={row.verified} />,
    },
    {
      key: "trust",
      header: <SortableHeader label="Trust" sortKey="trust" sort={sort} onToggle={toggleSort} />,
      ariaSort: sort && sort.key === "trust" ? (sort.dir === "asc" ? "ascending" : "descending") : "none",
      align: "right",
      render: (row) => <TrustScoreValue score={row.trustScore} />,
    },
    {
      key: "lastActive",
      header: "Last active",
      align: "right",
      render: (row) => (
        <span className="font-data text-xs text-ink/55 admin-dark:text-mist/55">
          <RelativeTime iso={row.lastActiveAt} fallback="Never" />
        </span>
      ),
    },
    {
      key: "joined",
      header: <SortableHeader label="Joined" sortKey="joined" sort={sort} onToggle={toggleSort} />,
      ariaSort: sort && sort.key === "joined" ? (sort.dir === "asc" ? "ascending" : "descending") : "none",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55 admin-dark:text-mist/55">{formatDate(row.createdAt)}</span>,
    },
  ];

  const hasFilters = role !== "" || verified !== "" || debouncedSearch !== "";
  const roleAndAdminGap = stats.seekerCount + stats.employerCount; // === verifiedCount + unverifiedCount, never totalUsers

  return (
    <div className="space-y-8">
      <section aria-labelledby="user-directory-snapshot-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="user-directory-snapshot-heading"
            className="font-display text-lg font-bold tracking-tight text-ink admin-dark:text-mist"
          >
            Platform snapshot
          </h2>
          <p className="text-xs text-ink/45 admin-dark:text-mist/45">Whole platform — not affected by the filters below</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Total users" value={stats.totalUsers.toLocaleString()} />
          <StatTile label="Seekers" value={stats.seekerCount.toLocaleString()} tone="marigold" />
          <StatTile label="Employers" value={stats.employerCount.toLocaleString()} tone="teal" />
          <StatTile label="Admins" value={stats.adminCount.toLocaleString()} />
          <StatTile label="Verified" value={stats.verifiedCount.toLocaleString()} tone="teal" />
          <StatTile label="Unverified" value={stats.unverifiedCount.toLocaleString()} tone="muted" />
        </div>
        <p className="text-xs text-ink/40 admin-dark:text-mist/40">
          Verified/unverified covers seekers and employers only ({roleAndAdminGap.toLocaleString()} accounts) —{" "}
          {stats.adminCount.toLocaleString()} admin account{stats.adminCount === 1 ? "" : "s"}{" "}
          {stats.adminCount === 1 ? "is" : "are"} excluded, since verification isn&rsquo;t a concept that applies to that role.
        </p>

        <UserSignupTrendChart signupTrend={signupTrend} />
      </section>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1 admin-dark:border-white/10 admin-dark:bg-white/5">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.value || "all"}
                  type="button"
                  aria-pressed={role === tab.value}
                  onClick={() => setRole(tab.value)}
                  className={pillTabClassName(role === tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              role="group"
              aria-label="Filter by verification state"
              className="inline-flex rounded-xl border border-ink/10 bg-white p-1 admin-dark:border-white/10 admin-dark:bg-white/5"
            >
              {VERIFIED_TABS.map((tab) => (
                <button
                  key={tab.value || "any"}
                  type="button"
                  aria-pressed={verified === tab.value}
                  onClick={() => setVerified(tab.value)}
                  className={pillTabClassName(verified === tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <label htmlFor="user-search" className="sr-only">
            Search users by email or name
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30 admin-dark:text-mist/30"
              aria-hidden="true"
            />
            <input
              id="user-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email or name…"
              className="w-64 rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/10 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/40 admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
            />
          </div>
        </div>

        <p className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-ink/45 admin-dark:text-mist/45">
          {hasFilters ? (
            <span>
              Showing <span className="font-data font-semibold text-ink admin-dark:text-mist">{items.length}</span> matching
              user{items.length === 1 ? "" : "s"} loaded
            </span>
          ) : (
            <span>
              Showing <span className="font-data font-semibold text-ink admin-dark:text-mist">{items.length}</span> of{" "}
              <span className="font-data font-semibold text-ink admin-dark:text-mist">{stats.totalUsers.toLocaleString()}</span>{" "}
              user{stats.totalUsers === 1 ? "" : "s"}
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
              getRowHref={(row) => `/admin/users/${row.id}`}
              getRowAriaLabel={(row) => `Open the 360-degree record for ${row.displayName ?? row.email}`}
              caption="Admin user directory: every user, any role, with verification, trust score and last activity"
              loading={loading}
              emptyState={
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center admin-dark:border-white/10 admin-dark:bg-white/5">
                  <UsersIcon className="h-6 w-6 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
                  <p className="font-display text-base font-bold text-ink admin-dark:text-mist">
                    {hasFilters ? "No users match these filters" : "No users yet"}
                  </p>
                  <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">
                    {hasFilters ? "Try a different role, verification state, or search term." : "Users will appear here once accounts are created."}
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
          Tip: press{" "}
          <kbd className="rounded border border-ink/15 bg-white px-1 py-0.5 font-data admin-dark:border-white/15 admin-dark:bg-white/5">
            ⌘K
          </kbd>{" "}
          /{" "}
          <kbd className="rounded border border-ink/15 bg-white px-1 py-0.5 font-data admin-dark:border-white/15 admin-dark:bg-white/5">
            Ctrl K
          </kbd>{" "}
          to jump straight to a user, company or job.
        </p>
      </div>
    </div>
  );
}
