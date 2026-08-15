"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type EmployerFormSelectOption = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: EmployerFormSelectOption[];
  placeholder: string;
  ariaLabel: string;
  searchable?: boolean;
  /** When true, omits the empty placeholder row (for required picks like sort). */
  hidePlaceholder?: boolean;
  className?: string;
};

export default function EmployerFormSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  searchable,
  hidePlaceholder = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const allOptions = hidePlaceholder
    ? options
    : [{ value: "", label: placeholder }, ...options];
  const selected = allOptions.find((opt) => opt.value === value) ?? allOptions[0];
  const showSearch = searchable ?? options.length > 8;
  const filtered = allOptions.filter((opt) => {
    if (!opt.value && query.trim()) return false;
    if (!query.trim()) return true;
    return opt.label.toLowerCase().includes(query.trim().toLowerCase());
  });

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
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((o) => !o)}
        className={`employer-ws-surface flex w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm outline-none transition hover:border-ink/20 focus-visible:border-teal focus-visible:ring-2 focus-visible:ring-teal/15 ${
          open ? "border-teal ring-2 ring-teal/15" : "border-ink/10"
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${value ? "font-medium text-ink" : "text-ink/45"}`}
        >
          {selected.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink/35 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="employer-ws-surface absolute inset-x-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-ink/10 shadow-[0_12px_40px_rgba(30,58,95,0.14)] ring-1 ring-navy/5">
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
                  className="employer-ws-surface-muted w-full rounded-lg border border-ink/8 py-2 pl-8 pr-2 text-xs outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
                  autoFocus
                />
              </div>
            </div>
          )}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-ink/45">No matches</li>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value || "placeholder"} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(opt.value)}
                      className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                        isSelected
                          ? "bg-teal/10 font-semibold text-ink"
                          : opt.value
                            ? "text-ink/70 hover:bg-ink/[0.04]"
                            : "text-ink/45 hover:bg-ink/[0.04]"
                      }`}
                    >
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 text-teal ${isSelected ? "opacity-100" : "opacity-0"}`}
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
