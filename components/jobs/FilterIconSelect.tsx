"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, Search } from "lucide-react";

type Option = { value: string; label: string };

type Props = {
  icon?: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  ariaLabel: string;
  searchable?: boolean;
  compact?: boolean;
};

export default function FilterIconSelect({
  icon: Icon,
  value,
  onChange,
  options,
  ariaLabel,
  searchable,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selected = options.find((opt) => opt.value === value) ?? options[0];
  const showSearch = searchable ?? options.length > 8;
  const filtered = options.filter((opt) =>
    query.trim() ? opt.label.toLowerCase().includes(query.trim().toLowerCase()) : true
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-mist/50 text-left outline-none transition hover:border-ink/20 hover:bg-mist/70 focus-visible:border-marigold focus-visible:ring-2 focus-visible:ring-marigold/20 ${
          compact ? "px-2.5 py-1.5 text-xs font-semibold" : "px-3 py-2.5 text-sm"
        } ${Icon ? "pl-3" : ""}`}
      >
        {Icon && (
          <Icon
            className={`shrink-0 text-navy/45 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
            aria-hidden="true"
          />
        )}
        <span className={`min-w-0 flex-1 truncate ${compact ? "text-ink" : "text-ink/85"}`}>
          {selected?.label}
        </span>
        <ChevronDown
          className={`shrink-0 text-ink/35 transition-transform ${open ? "rotate-180" : ""} ${
            compact ? "h-3.5 w-3.5" : "h-4 w-4"
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1.5 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-[0_12px_40px_rgba(32,36,43,0.12)] ring-1 ring-ink/5 ${
            compact ? "right-0 min-w-[10rem]" : "inset-x-0"
          }`}
        >
          {showSearch && (
            <div className="border-b border-ink/6 p-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink/35"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full rounded-lg border border-ink/8 bg-mist/40 py-2 pl-8 pr-2 text-xs outline-none focus:border-marigold focus:ring-1 focus:ring-marigold/20"
                  autoFocus
                />
              </div>
            </div>
          )}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className={`jobs-workspace-scroll overflow-y-auto py-1 ${compact ? "max-h-48" : "max-h-60"}`}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-ink/45">No matches</li>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value || "empty"} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(opt.value)}
                      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? "bg-marigold/10 font-semibold text-ink"
                          : "text-ink/70 hover:bg-ink/[0.04]"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 text-marigold ${isSelected ? "opacity-100" : "opacity-0"}`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
