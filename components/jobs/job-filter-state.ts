import type { SalaryPeriod } from "@/lib/format";

export type JobFilterState = {
  category: string;
  industry: string;
  location: string;
  employmentType: string;
  remoteType: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: SalaryPeriod;
  postedWithin: string;
};

export const emptyJobFilters = (): JobFilterState => ({
  category: "",
  industry: "",
  location: "",
  employmentType: "",
  remoteType: "",
  salaryMin: "",
  salaryMax: "",
  salaryPeriod: "MONTHLY",
  postedWithin: "",
});

export function countActiveFilters(filters: JobFilterState) {
  return [
    filters.category,
    filters.industry,
    filters.location,
    filters.employmentType,
    filters.remoteType,
    filters.salaryMin,
    filters.salaryMax,
    filters.postedWithin,
  ].filter(Boolean).length;
}

export function filtersEqual(a: JobFilterState, b: JobFilterState) {
  return (
    a.category === b.category &&
    a.industry === b.industry &&
    a.location === b.location &&
    a.employmentType === b.employmentType &&
    a.remoteType === b.remoteType &&
    a.salaryMin === b.salaryMin &&
    a.salaryMax === b.salaryMax &&
    a.salaryPeriod === b.salaryPeriod &&
    a.postedWithin === b.postedWithin
  );
}

export function buildJobSearchParams(
  filters: JobFilterState,
  opts: { q?: string; sort?: string; cursor?: string | null } = {}
) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.location) params.set("location", filters.location);
  if (filters.employmentType) params.set("employmentType", filters.employmentType);
  if (filters.remoteType) params.set("remoteType", filters.remoteType);
  if (filters.salaryMin) params.set("salaryMin", filters.salaryMin);
  if (filters.salaryMax) params.set("salaryMax", filters.salaryMax);
  if (filters.salaryMin || filters.salaryMax) params.set("salaryPeriod", filters.salaryPeriod);
  if (filters.postedWithin) params.set("postedWithin", filters.postedWithin);
  if (opts.sort && opts.sort !== "newest") params.set("sort", opts.sort);
  if (opts.cursor) params.set("cursor", opts.cursor);
  return params;
}
