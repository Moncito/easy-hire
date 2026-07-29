"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Download } from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";

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
      const res = await fetch("/api/employer/saved-seekers");
      if (!res.ok) {
        setSeekers([]);
        setError("Could not load saved candidates");
        return;
      }
      const data = await res.json();
      setSeekers(data.seekers);
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
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Talent Search</h1>
        <p className="mt-1.5 text-sm text-ink/50">
          Browse verified virtual assistant profiles and save candidates for later.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search by name, skills, headline..."
            className="w-full rounded-xl border border-ink/10 py-2.5 pl-10 pr-4 text-sm text-ink outline-none focus:border-teal"
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal/95 disabled:opacity-60"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
            filtersOpen || activeFilterCount > 0
              ? "border-teal/30 bg-teal/8 text-teal"
              : "border-ink/10 text-ink/70 hover:bg-ink/3"
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
              : "border-ink/10 text-ink/70 hover:bg-ink/3"
          }`}
        >
          Saved
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-ink/8 bg-white p-4 sm:grid-cols-3">
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
        <p className="text-sm text-ink/45">Searching...</p>
      ) : searched && seekers.length === 0 ? (
        <div className="rounded-2xl border border-ink/8 bg-white p-12 text-center shadow-xs">
          <p className="text-sm font-medium text-ink/60">No candidates found</p>
          <p className="mt-1 text-xs text-ink/40">Try different keywords or check back as more VAs join.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {seekers.map((seeker) => (
            <div
              key={seeker.id}
              className="rounded-2xl border border-ink/8 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal/10 font-display text-sm font-bold text-teal">
                    {seeker.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <Link
                      href={`/employer/talent/${seeker.id}`}
                      className="font-display text-base font-bold text-ink hover:text-teal"
                    >
                      {seeker.fullName}
                    </Link>
                    <p className="text-xs text-ink/50">{seeker.headline || "Virtual Assistant"}</p>
                  </div>
                </div>
                <SaveSeekerButton seekerId={seeker.id} saved={seeker.saved} onToggle={handleToggleSaved} />
              </div>

              {seeker.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {seeker.skills.slice(0, 5).map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/65"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-1 text-xs text-ink/55">
                {seeker.location && <p>{seeker.location}</p>}
                {seeker.availability && <p>{seeker.availability}</p>}
                <p>
                  Expected: {formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax)}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/employer/talent/${seeker.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/3"
                >
                  View profile
                </Link>
                <MessageSeekerButton seekerId={seeker.id} />
                {seeker.resumeUrl && (
                  <a
                    href={`/api/employer/talent/${seeker.id}/resume`}
                    className="inline-flex items-center gap-1 rounded-xl border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/3"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Resume
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
