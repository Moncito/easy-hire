"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, MessageSquare, Search } from "lucide-react";
import { formatPesoRange } from "@/lib/format";

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

export default function TalentSearchBoard() {
  const [query, setQuery] = useState("");
  const [seekers, setSeekers] = useState<TalentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/employer/saved-seekers");
    if (res.ok) {
      const data = await res.json();
      setSeekers(data.seekers);
    }
    setLoading(false);
    setSearched(true);
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setShowSaved(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const res = await fetch(`/api/employer/talent/search?${params}`);
    if (res.ok) {
      const data = await res.json();
      setSeekers(data.seekers);
    }
    setLoading(false);
    setSearched(true);
  }, [query]);

  useEffect(() => {
    search();
  }, []);

  async function toggleSave(seekerId: string, currentlySaved: boolean) {
    const res = currentlySaved
      ? await fetch(`/api/employer/saved-seekers/${seekerId}`, { method: "DELETE" })
      : await fetch("/api/employer/saved-seekers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seekerId }),
        });

    if (res.ok) {
      setSeekers((prev) =>
        prev.map((s) => (s.id === seekerId ? { ...s, saved: !currentlySaved } : s))
      );
    }
  }

  async function startConversation(seekerId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seekerId }),
    });

    if (res.ok) {
      const conv = await res.json();
      window.location.href = `/employer/messages?c=${conv.id}`;
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Talent Search</h1>
        <p className="mt-1.5 text-sm text-ink/50">
          Browse verified virtual assistant profiles and save candidates for later.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
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
                    <h3 className="font-display text-base font-bold text-ink">{seeker.fullName}</h3>
                    <p className="text-xs text-ink/50">{seeker.headline || "Virtual Assistant"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSave(seeker.id, seeker.saved)}
                  className="rounded-lg p-2 text-ink/40 hover:bg-ink/5 hover:text-teal"
                  aria-label={seeker.saved ? "Remove bookmark" : "Save candidate"}
                >
                  {seeker.saved ? (
                    <BookmarkCheck className="h-4 w-4 text-teal" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </button>
              </div>

              {seeker.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {seeker.skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/65"
                    >
                      {skill}
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
                <button
                  type="button"
                  onClick={() => startConversation(seeker.id)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal/95"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message
                </button>
                {seeker.resumeUrl && (
                  <Link
                    href={seeker.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-ink/10 px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-ink/3"
                  >
                    Resume
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
