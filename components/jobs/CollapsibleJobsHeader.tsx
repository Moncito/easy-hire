"use client";

import { useState } from "react";
import { Globe, Wallet, ShieldCheck, ChevronDown } from "lucide-react";

const perks = [
  { icon: Globe, label: "Work globally" },
  { icon: Wallet, label: "Guaranteed PHP pay ranges" },
  { icon: ShieldCheck, label: "Verified employers" },
] as const;

export default function CollapsibleJobsHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2 shrink-0 lg:mb-1">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="jobs-hero-panel"
        className="group inline-flex cursor-pointer items-center gap-1 rounded-full border border-navy/10 bg-white/85 px-1.5 py-1 shadow-sm backdrop-blur-sm transition hover:border-marigold/35 hover:bg-white active:scale-[0.98]"
      >
        {perks.map(({ icon: Icon, label }) => (
          <span
            key={label}
            title={label}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-marigold/10 text-marigold transition group-hover:bg-marigold/15"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </span>
        ))}
        <span className="mx-0.5 hidden h-4 w-px bg-ink/10 sm:block" aria-hidden="true" />
        <span className="hidden pr-0.5 text-xs font-semibold text-ink/65 sm:inline">Premium VA jobs</span>
        <ChevronDown
          className={`mr-0.5 h-3.5 w-3.5 text-ink/45 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id="jobs-hero-panel"
          className="mt-2 max-w-xl animate-scale-in rounded-2xl border border-navy/8 bg-white p-4 shadow-[0_4px_20px_rgba(30,58,95,0.06)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal">EasyHire Jobs</p>
          <h2 className="mt-1 font-display text-base font-bold text-ink">Work Globally, Earn Locally</h2>
          <p className="mt-0.5 font-display text-sm font-semibold text-navy/80">Premium Jobs for Filipino VAs</p>
          <p className="mt-2 text-xs leading-relaxed text-ink/55">
            Unlock remote careers that match your lifestyle. Browse 100% verified opportunities with
            guaranteed PHP salary ranges and zero agency middlemen.
          </p>
        </div>
      )}
    </div>
  );
}
