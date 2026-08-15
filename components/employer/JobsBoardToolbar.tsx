"use client";

import { Search } from "lucide-react";
import EmployerFormSelect from "@/components/employer/ui/EmployerFormSelect";

type SortOption = "updated" | "applicants" | "attention";

const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "applicants", label: "Most applicants" },
  { value: "attention", label: "Needs attention" },
] as const;

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
};

export default function JobsBoardToolbar({
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
          placeholder="Search by title, location, or category…"
          className="employer-ws-surface w-full rounded-xl border border-ink/10 py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-teal"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-ink/45">Sort</span>
        <EmployerFormSelect
          className="w-44"
          value={sort}
          onChange={(value) => onSortChange(value as SortOption)}
          options={[...SORT_OPTIONS]}
          placeholder=""
          hidePlaceholder
          searchable={false}
          ariaLabel="Sort job listings"
        />
        <span className="hidden text-xs text-ink/40 sm:inline">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}

export type { SortOption };
