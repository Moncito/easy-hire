"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw, Search, Users as UsersIcon } from "lucide-react";
import DataTable, { type DataTableColumn } from "./DataTable";
import { RoleBadge, VerifiedBadge, TrustScoreValue, formatDate } from "./badges";
import { fetchUserDirectoryPage } from "./api";
import type { Role, SerializedUserDirectoryItem, UserDirectoryVerifiedFilter } from "./types";

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

export type UserDirectoryProps = {
  initialItems: SerializedUserDirectoryItem[];
  initialNextCursor: string | null;
};

export default function UserDirectory({ initialItems, initialNextCursor }: UserDirectoryProps) {
  const [role, setRole] = useState<Role | "">("");
  const [verified, setVerified] = useState<UserDirectoryVerifiedFilter | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  const columns: DataTableColumn<SerializedUserDirectoryItem>[] = [
    {
      key: "user",
      header: "User",
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium text-ink">{row.displayName ?? row.email}</p>
          {row.displayName && <p className="truncate text-xs text-ink/45">{row.email}</p>}
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
      header: "Trust",
      align: "right",
      render: (row) => <TrustScoreValue score={row.trustScore} />,
    },
    {
      key: "joined",
      header: "Joined",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55">{formatDate(row.createdAt)}</span>,
    },
  ];

  const hasFilters = role !== "" || verified !== "" || debouncedSearch !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                aria-pressed={role === tab.value}
                onClick={() => setRole(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                  role === tab.value ? "bg-navy text-white" : "text-ink/55 hover:bg-ink/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label htmlFor="user-verified-filter" className="sr-only">
            Filter by verification state
          </label>
          <select
            id="user-verified-filter"
            value={verified}
            onChange={(e) => setVerified(e.target.value as UserDirectoryVerifiedFilter | "")}
            className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink/70 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          >
            {VERIFIED_TABS.map((tab) => (
              <option key={tab.value || "any"} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="user-search" className="sr-only">
          Search users by email or name
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" aria-hidden="true" />
          <input
            id="user-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by email or name…"
            className="w-64 rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
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
            getRowHref={(row) => `/admin/users/${row.id}`}
            getRowAriaLabel={(row) => `Open the 360-degree record for ${row.displayName ?? row.email}`}
            caption="Admin user directory: every user, any role, with verification and trust score"
            loading={loading}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
                <UsersIcon className="h-6 w-6 text-ink/30" aria-hidden="true" />
                <p className="font-display text-base font-bold text-ink">
                  {hasFilters ? "No users match these filters" : "No users yet"}
                </p>
                <p className="max-w-xs text-sm text-ink/50">
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
                className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/65 hover:bg-ink/5 disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-center text-[11px] text-ink/35">
        Tip: press <kbd className="rounded border border-ink/15 bg-white px-1 py-0.5 font-data">⌘K</kbd> /{" "}
        <kbd className="rounded border border-ink/15 bg-white px-1 py-0.5 font-data">Ctrl K</kbd> to jump straight to a
        user, company or job.
      </p>
    </div>
  );
}
