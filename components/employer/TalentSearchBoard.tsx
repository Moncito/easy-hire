"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Download } from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import { listSavedSeekers } from "@/lib/client/saved-seekers";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import Bone from "@/components/employer/skeletons/Bone";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import ProTalentPageHeader from "@/components/employer/pro-dashboard/ProTalentPageHeader";
import ProTalentCard from "@/components/employer/talent/ProTalentCard";
import ProButton from "@/components/employer/pro/ProButton";

type TalentItem = {
  id: string;
  fullName: string;
  photoUrl: string | null;
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

function TalentListSkeleton({ pro = false }: { pro?: boolean }) {
  if (pro) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pro-card flex gap-4 p-5">
            <Bone className="h-14 w-14 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bone className="h-4 w-44" />
              <Bone className="h-3 w-56" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
  const { isPro } = useEmployerShell();
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
  const searchFocus = isPro
    ? "focus:border-ink/25 focus:ring-2 focus:ring-ink/10"
    : "focus:border-teal focus:ring-2 focus:ring-teal/15";
  const filterFocus = isPro ? "focus:border-ink/25" : "focus:border-teal";
  const toolActive = isPro
    ? "border-ink bg-ink text-white"
    : "border-teal/30 bg-teal/8 text-teal";
  const toolIdle =
    "border-ink/10 bg-white text-ink/70 hover:bg-ink/3";

  return (
    <div>
      {isPro ? (
        <ProTalentPageHeader
          resultCount={searched && !loading ? seekers.length : undefined}
          savedMode={showSaved}
        />
      ) : (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-ink/50">
            Search verified VA profiles. Save candidates or message them directly from the platform.
          </p>
        </div>
      )}

      <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:items-center ${isPro ? "mb-5" : ""}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search by name, skills, headline..."
            className={`w-full rounded-full border border-ink/10 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none ${searchFocus}`}
          />
        </div>
        {isPro ? (
          <ProButton type="button" onClick={search} disabled={loading} variant="primary">
            Search
          </ProButton>
        ) : (
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/20 hover:bg-teal/95 disabled:opacity-60"
          >
            Search
          </button>
        )}
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
            isPro ? "min-h-11 rounded-full border" : "rounded-xl border"
          } ${filtersOpen || activeFilterCount > 0 ? toolActive : toolIdle}`}
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
          className={`${isPro ? "min-h-11 rounded-full border px-5 py-2.5 text-sm font-semibold" : "rounded-xl border px-5 py-2.5 text-sm font-semibold"} transition-colors ${
            showSaved ? toolActive : toolIdle
          }`}
        >
          Saved
        </button>
      </div>

      {filtersOpen && (
        <div
          className={`mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 ${
            isPro ? "pro-card" : "rounded-2xl border border-ink/8 bg-white/80"
          }`}
        >
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Skill (e.g. Bookkeeping)"
            className={`rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none ${filterFocus}`}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Cebu)"
            className={`rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none ${filterFocus}`}
          />
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className={`rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none ${filterFocus}`}
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
              className={`px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90 ${
                isPro ? "rounded-full bg-ink" : "rounded-xl bg-ink"
              }`}
            >
              Apply filters
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-4 text-sm text-ember">{error}</p>}

      {loading ? (
        <TalentListSkeleton pro={isPro} />
      ) : searched && seekers.length === 0 ? (
        <EmployerEmptyState
          title={showSaved ? "No saved candidates" : "No candidates found"}
          description={
            showSaved
              ? "Bookmark a profile from search, or add people to a saved list."
              : "Try different keywords or check back as more VAs join the platform."
          }
          action={
            isPro && showSaved ? (
              <ProButton href="/employer/talent/lists" variant="primary">
                Open saved lists
              </ProButton>
            ) : undefined
          }
        />
      ) : isPro ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {seekers.map((seeker) => (
            <ProTalentCard key={seeker.id} seeker={seeker} onToggleSaved={handleToggleSaved} />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/5 bg-white/60 shadow-sm">
          {seekers.map((seeker) => (
              <div
                key={seeker.id}
                className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-center"
              >
                <Link
                  href={`/employer/talent/${seeker.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <EmployerAvatar
                    name={seeker.fullName}
                    imageUrl={seeker.photoUrl}
                    size="lg"
                  />
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
          ))}
        </div>
      )}
    </div>
  );
}
