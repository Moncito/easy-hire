"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Download } from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import { listSavedSeekers } from "@/lib/client/saved-seekers";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import Bone from "@/components/employer/skeletons/Bone";

type TalentItem = {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  saved: boolean;
};

const availabilityOptions = [
  { value: "", label: "Any availability" },
  { value: "Full-time", label: "Full-time" },
  { value: "Part-time", label: "Part-time" },
  { value: "Project-based", label: "Project-based" },
];

function TalentListSkeleton() {
  return (
    <div className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/5 bg-white/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Bone className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-56" />
          </div>
          <Bone className="hidden h-4 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

export default function TalentSearchBoard() {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [seekers, setSeekers] = useState<TalentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState("");

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listSavedSeekers();
      if (!data) {
        setSeekers([]);
        setError("Could not load saved candidates");
        return;
      }
      setSeekers(data.seekers as TalentItem[]);
    } catch {
      setSeekers([]);
      setError("Could not load saved candidates");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setShowSaved(false);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (skill.trim()) params.set("skill", skill.trim());
      if (location.trim()) params.set("location", location.trim());
      if (availability) params.set("availability", availability);
      const res = await fetch(`/api/employer/talent/search?${params}`);
      if (!res.ok) {
        setSeekers([]);
        setError("Search failed");
        return;
      }
      const data = await res.json();
      setSeekers(data.seekers);
    } catch {
      setSeekers([]);
      setError("Search failed");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [query, skill, location, availability]);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggleSaved(seekerId: string, nextSaved: boolean) {
    setSeekers((prev) => prev.map((s) => (s.id === seekerId ? { ...s, saved: nextSaved } : s)));
  }

  const activeFilterCount = [skill, location, availability].filter(Boolean).length;

  return (
    <div>
      <p className="mb-6 max-w-xl text-sm text-ink/50">
        Search verified VA profiles. Save candidates or message them directly from the platform.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search by name, skills, headline..."
            className="w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/20 hover:bg-teal/95 disabled:opacity-60"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            filtersOpen || activeFilterCount > 0
              ? "border-teal/30 bg-teal/8 text-teal"
              : "border-ink/10 bg-white text-ink/70 hover:bg-ink/3"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowSaved(true);
            loadSaved();
          }}
          className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
            showSaved
              ? "border-teal/30 bg-teal/8 text-teal"
              : "border-ink/10 bg-white text-ink/70 hover:bg-ink/3"
          }`}
        >
          Saved
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-ink/8 bg-white/80 p-4 sm:grid-cols-3">
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill (e.g. Bookkeeping)"
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Cebu)"
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          />
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
          >
            {availabilityOptions.map((opt) => (
              <option key={opt.value || "any-avail"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={search}
              className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-ember">{error}</p>}

      {loading ? (
        <TalentListSkeleton />
      ) : searched && seekers.length === 0 ? (
        <EmployerEmptyState
          title="No candidates found"
          description="Try different keywords or check back as more VAs join the platform."
        />
      ) : (
        <div className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/5 bg-white/60 shadow-sm">
          {seekers.map((seeker) => {
            const initials = seeker.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={seeker.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-center"
              >
                <Link
                  href={`/employer/talent/${seeker.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/10 font-display text-sm font-bold text-teal">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-ink hover:text-teal">{seeker.fullName}</p>
                    <p className="truncate text-xs text-ink/45">
                      {seeker.headline || "Virtual Assistant"}
                      {seeker.location ? ` · ${seeker.location}` : ""}
                    </p>
                    {seeker.skills.length > 0 && (
                      <p className="mt-1 truncate text-[11px] text-ink/40">
                        {seeker.skills.slice(0, 4).join(" · ")}
                      </p>
                    )}
                  </div>
                </Link>

                <p className="hidden shrink-0 font-data text-xs tabular-nums text-ink/55 sm:block">
                  {formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax)}
                </p>

                <div className="flex shrink-0 items-center gap-2">
                  <SaveSeekerButton
                    seekerId={seeker.id}
                    saved={seeker.saved}
                    onToggle={handleToggleSaved}
                  />
                  <MessageSeekerButton seekerId={seeker.id} />
                  {seeker.resumeUrl && (
                    <a
                      href={`/api/employer/talent/${seeker.id}/resume`}
                      className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink/3"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Resume</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
