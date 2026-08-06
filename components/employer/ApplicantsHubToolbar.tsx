"use client";

import { Search } from "lucide-react";

export type ApplicantsSortOption = "updated" | "applicants" | "review" | "title";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  sort: ApplicantsSortOption;
  onSortChange: (value: ApplicantsSortOption) => void;
  resultCount: number;
};

export default function ApplicantsHubToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  resultCount,
}: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by title or location…"
          className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-teal"
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="applicants-sort" className="text-xs font-medium text-ink/45">
          Sort
        </label>
        <select
          id="applicants-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ApplicantsSortOption)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal"
        >
          <option value="updated">Recently updated</option>
          <option value="applicants">Most applicants</option>
          <option value="review">Needs review</option>
          <option value="title">A–Z</option>
        </select>
        <span className="hidden text-xs text-ink/40 sm:inline">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
