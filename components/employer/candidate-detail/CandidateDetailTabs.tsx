"use client";

import type { CandidateDetailTab } from "./types";

const TABS: { id: CandidateDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "application", label: "Application" },
  { id: "notes", label: "Notes" },
];

type Props = {
  active: CandidateDetailTab;
  onChange: (tab: CandidateDetailTab) => void;
};

export default function CandidateDetailTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 border-b border-ink/6 px-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`relative px-3 py-2.5 text-xs font-semibold transition ${
            active === tab.id ? "text-teal" : "text-ink/45 hover:text-ink/70"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-teal" />
          )}
        </button>
      ))}
    </div>
  );
}
