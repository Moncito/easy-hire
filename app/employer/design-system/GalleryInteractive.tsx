"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DropdownMenu, FilterButton, SearchInput, SegmentedControl } from "@/components/employer/system";

/** Stateful demos for the development-only component gallery. */
export default function GalleryInteractive() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [filters, setFilters] = useState<Record<string, boolean>>({ "Needs review": true, "Has applicants": false });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        label="Search jobs, applicants, or skills"
        value={query}
        onValueChange={setQuery}
        shortcut="⌘K"
        className="w-72"
      />
      <SegmentedControl
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: "list", label: "List" },
          { value: "board", label: "Board" },
        ]}
      />
      {Object.entries(filters).map(([name, active]) => (
        <FilterButton key={name} active={active} onClick={() => setFilters((f) => ({ ...f, [name]: !f[name] }))}>
          {name}
        </FilterButton>
      ))}
      <DropdownMenu
        label="More actions for the example listing"
        items={[
          { label: "Share listing", onSelect: () => toast("Share selected") },
          { label: "Edit listing", onSelect: () => toast("Edit selected") },
          { label: "Close listing", onSelect: () => toast("Close selected"), tone: "danger" },
        ]}
      />
    </div>
  );
}
