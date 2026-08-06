"use client";

import { Search } from "lucide-react";

export default function EmployerSearchTrigger() {
  function openPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
  }

  return (
    <button
      type="button"
      onClick={openPalette}
      className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-ink/8 bg-white/70 px-3.5 py-2 text-sm text-ink/40 shadow-sm transition hover:border-ink/12 hover:bg-white md:flex"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search jobs, applicants, or skills…</span>
      <kbd className="hidden rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-ink/35 lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}
