"use client";

import { Search } from "lucide-react";

type Props = {
  className?: string;
};

export default function EmployerSearchTrigger({ className }: Props) {
  function openPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  }

  return (
    <button
      type="button"
      onClick={openPalette}
      className={`employer-topbar-search hidden w-full max-w-md items-center gap-2 rounded-xl border px-3.5 py-2 text-sm shadow-sm transition md:flex ${className ?? ""}`}
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search jobs, applicants, or skills…</span>
      <kbd className="hidden rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-ink/35 lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}
