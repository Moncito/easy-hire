"use client";

import {
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  SlidersHorizontal,
} from "lucide-react";
import JobFilterAccordion from "@/components/jobs/JobFilterAccordion";
import FilterIconSelect from "@/components/jobs/FilterIconSelect";
import { ROLE_TYPES, INDUSTRIES } from "@/lib/constants/job-categories";
import { periodSuffix, type SalaryPeriod } from "@/lib/format";

const SALARY_PRESETS = [
  { label: "₱30,000+", value: 30000 },
  { label: "₱50,000+", value: 50000 },
  { label: "₱80,000+", value: 80000 },
  { label: "₱100,000+", value: 100000 },
] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? "border-marigold/40 bg-marigold/15 text-[#8a5a10]"
          : "border-ink/10 bg-mist/40 text-ink/60 hover:border-ink/20 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export type JobFiltersPanelProps = {
  variant: "desktop" | "mobile";
  location: string;
  onLocationChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  industry: string;
  onIndustryChange: (v: string) => void;
  employmentType: string;
  onEmploymentTypeChange: (v: string) => void;
  remoteType: string;
  onRemoteTypeChange: (v: string) => void;
  salaryMin: string;
  onSalaryMinChange: (v: string) => void;
  salaryMax: string;
  onSalaryMaxChange: (v: string) => void;
  salaryPeriod: SalaryPeriod;
  onSalaryPeriodChange: (v: SalaryPeriod) => void;
  postedWithin: string;
  onPostedWithinChange: (v: string) => void;
  onSalaryPreset: (min: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  activeFilterCount: number;
  hasPendingChanges?: boolean;
  employmentOptions: { value: string; label: string }[];
  remoteOptions: { value: string; label: string }[];
  salaryPeriodOptions: { value: SalaryPeriod; label: string }[];
  postedWithinOptions: { value: string; label: string }[];
  /** Keyword search — mobile only (desktop uses middle-column header). */
  query?: string;
  onQueryChange?: (v: string) => void;
};

export default function JobFiltersPanel({
  variant,
  location,
  onLocationChange,
  category,
  onCategoryChange,
  industry,
  onIndustryChange,
  employmentType,
  onEmploymentTypeChange,
  remoteType,
  onRemoteTypeChange,
  salaryMin,
  onSalaryMinChange,
  salaryMax,
  onSalaryMaxChange,
  salaryPeriod,
  onSalaryPeriodChange,
  postedWithin,
  onPostedWithinChange,
  onSalaryPreset,
  onSubmit,
  loading,
  activeFilterCount,
  hasPendingChanges = false,
  employmentOptions,
  remoteOptions,
  salaryPeriodOptions,
  postedWithinOptions,
  query = "",
  onQueryChange,
}: JobFiltersPanelProps) {
  const activePreset = SALARY_PRESETS.find((p) => salaryMin === String(p.value) && !salaryMax)?.value;

  return (
    <form onSubmit={onSubmit} className="space-y-1">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-marigold/15 text-marigold">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-sm font-bold text-ink">Filters</h2>
          {activeFilterCount > 0 && (
            <p className="text-[11px] text-ink/45">
              {activeFilterCount} applied · {hasPendingChanges ? "unsaved changes" : "up to date"}
            </p>
          )}
          {activeFilterCount === 0 && hasPendingChanges && (
            <p className="text-[11px] text-marigold/80">Unsaved filter changes</p>
          )}
        </div>
      </div>

      {variant === "mobile" && onQueryChange && (
        <JobFilterAccordion title="Keywords" defaultOpen>
          <div className="relative">
            <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Role, skill, company..."
              className="w-full rounded-xl border border-ink/10 bg-mist/50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
            />
          </div>
        </JobFilterAccordion>
      )}

      <JobFilterAccordion title="Location" defaultOpen>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Philippines, Cebu..."
            className="w-full rounded-xl border border-ink/10 bg-mist/50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
          />
        </div>
      </JobFilterAccordion>

      <JobFilterAccordion title="Role & industry" defaultOpen={variant === "desktop"}>
        <FilterIconSelect
          icon={Briefcase}
          value={category}
          onChange={onCategoryChange}
          ariaLabel="Role type"
          searchable
          options={[{ value: "", label: "All role types" }, ...ROLE_TYPES.map((rt) => ({ value: rt.label, label: rt.label }))]}
        />
        <FilterIconSelect
          icon={Building2}
          value={industry}
          onChange={onIndustryChange}
          ariaLabel="Industry"
          searchable
          options={[{ value: "", label: "All industries" }, ...INDUSTRIES.map((ind) => ({ value: ind.label, label: ind.label }))]}
        />
      </JobFilterAccordion>

      <JobFilterAccordion title="Employment" defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5">
          {employmentOptions.map((opt) => (
            <Chip
              key={opt.value || "any-emp"}
              active={employmentType === opt.value}
              onClick={() => onEmploymentTypeChange(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </JobFilterAccordion>

      <JobFilterAccordion title="Work setup" defaultOpen={false}>
        <div className="flex flex-wrap gap-1.5">
          {remoteOptions.map((opt) => (
            <Chip
              key={opt.value || "any-remote"}
              active={remoteType === opt.value}
              onClick={() => onRemoteTypeChange(opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </JobFilterAccordion>

      <JobFilterAccordion title="Pay range (PHP)" defaultOpen>
        <div className="flex flex-wrap gap-1.5">
          {SALARY_PRESETS.map((preset) => (
            <Chip
              key={preset.value}
              active={activePreset === preset.value}
              onClick={() => onSalaryPreset(preset.value)}
            >
              {preset.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {salaryPeriodOptions.map((p) => (
            <Chip key={p.value} active={salaryPeriod === p.value} onClick={() => onSalaryPeriodChange(p.value)}>
              {p.label}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={salaryMin}
            onChange={(e) => onSalaryMinChange(e.target.value)}
            placeholder={`Min${periodSuffix(salaryPeriod)}`}
            className="w-full rounded-xl border border-ink/10 bg-mist/50 px-3 py-2 font-data text-sm outline-none focus:border-marigold"
          />
          <input
            type="number"
            value={salaryMax}
            onChange={(e) => onSalaryMaxChange(e.target.value)}
            placeholder={`Max${periodSuffix(salaryPeriod)}`}
            className="w-full rounded-xl border border-ink/10 bg-mist/50 px-3 py-2 font-data text-sm outline-none focus:border-marigold"
          />
        </div>
      </JobFilterAccordion>

      <JobFilterAccordion title="Date posted" defaultOpen={false}>
        <FilterIconSelect
          icon={Calendar}
          value={postedWithin}
          onChange={onPostedWithinChange}
          ariaLabel="Date posted"
          options={postedWithinOptions}
        />
      </JobFilterAccordion>

      <button
        type="submit"
        disabled={loading || !hasPendingChanges}
        className={`mt-4 w-full cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          hasPendingChanges
            ? "bg-marigold text-ink shadow-sm hover:bg-marigold/90"
            : "border border-ink/10 bg-ink/[0.03] text-ink/40"
        }`}
      >
        {loading ? "Searching..." : hasPendingChanges ? "Apply filters" : "Filters applied"}
      </button>
    </form>
  );
}
