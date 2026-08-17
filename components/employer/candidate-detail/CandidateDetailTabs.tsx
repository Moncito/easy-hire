"use client";

import type { CandidateDetailTab } from "./types";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

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
  const { isPro } = useEmployerShell();

  return (
    <div className="flex gap-1 border-b border-ink/6 px-4">
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-2.5 text-xs font-semibold transition ${
              isActive
                ? isPro
                  ? "text-ink"
                  : "text-teal"
                : "text-ink/45 hover:text-ink/70"
            }`}
          >
            {tab.label}
            {isActive && (
              <span
                className={`absolute inset-x-1 bottom-0 h-0.5 rounded-full ${
                  isPro ? "bg-ink" : "bg-teal"
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
