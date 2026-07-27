"use client";

import { useEffect, useState } from "react";
import KanbanBoard from "./KanbanBoard";
import { X, Paperclip, MapPin, DollarSign, CheckCircle, XCircle, Star } from "lucide-react";
import { formatPesoRange } from "@/lib/format";

type SeekerSummary = {
  id: string;
  fullName: string;
  headline: string | null;
  skills: string[];
  resumeUrl: string | null;
  location: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
};

type Application = {
  id: string;
  status: string;
  coverNote: string | null;
  internalNotes: string | null;
  rating: number | null;
  appliedAt: string;
  seeker: SeekerSummary;
};

type JobContext = {
  id: string;
  status: string;
};

type Props = {
  job: JobContext;
  initialApplications: Application[];
};

export default function ApplicantsBoard({ job, initialApplications }: Props) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      setNoteInput(selectedApp.internalNotes || "");
    }
  }, [selectedApp]);

  async function patchApplication(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const result = await res.json();
      throw new Error(result.error || "Update failed");
    }

    return res.json() as Promise<Application>;
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const previous = applications;
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const updated = await patchApplication(id, { status: newStatus });
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, ...updated } : app)));
      if (selectedApp?.id === id) {
        setSelectedApp((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch {
      setApplications(previous);
      if (selectedApp?.id === id) {
        setSelectedApp(previous.find((a) => a.id === id) || null);
      }
    }
  }

  async function handleSaveNotes() {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      const updated = await patchApplication(selectedApp.id, { internalNotes: noteInput.trim() || null });
      setApplications((prev) => prev.map((app) => (app.id === selectedApp.id ? { ...app, ...updated } : app)));
      setSelectedApp((prev) => (prev ? { ...prev, ...updated } : null));
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleRating(rating: number) {
    if (!selectedApp) return;
    const nextRating = selectedApp.rating === rating ? null : rating;
    const updated = await patchApplication(selectedApp.id, { rating: nextRating });
    setApplications((prev) => prev.map((app) => (app.id === selectedApp.id ? { ...app, ...updated } : app)));
    setSelectedApp((prev) => (prev ? { ...prev, ...updated } : null));
  }

  return (
    <div className="relative">
      <KanbanBoard
        applications={applications}
        job={job}
        onStatusChange={handleStatusChange}
        onCardClick={(app) => setSelectedApp(app as Application)}
      />

      {selectedApp && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedApp(null)}
        />
      )}

      <div
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-lg transform flex-col border-l border-ink/5 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          selectedApp ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedApp && (
          <>
            <div className="flex shrink-0 items-start justify-between border-b border-ink/5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 font-display text-lg font-bold text-teal">
                  {selectedApp.seeker.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-ink">{selectedApp.seeker.fullName}</h3>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {selectedApp.seeker.headline || "Virtual Assistant"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="cursor-pointer rounded-xl p-2 text-ink/40 hover:bg-ink/5 hover:text-ink"
                aria-label="Close candidate details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div className="flex items-center justify-between rounded-2xl border border-ink/5 bg-mist p-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-ink/40">
                    Current Stage
                  </span>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="HIRED">Hired</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {selectedApp.status !== "REJECTED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApp.id, "REJECTED")}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ember/20 px-3 py-1.5 text-xs font-bold text-ember transition-colors hover:bg-ember/5"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  )}
                  {selectedApp.status !== "HIRED" && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApp.id, "HIRED")}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal/95"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Hire VA
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink/45">Candidate Profile</h4>

                {selectedApp.seeker.skills.length > 0 && (
                  <div>
                    <span className="mb-1.5 block text-xs text-ink/40">Core Skills</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedApp.seeker.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/70"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-ink/65">
                    <MapPin className="h-4 w-4 shrink-0 text-ink/30" aria-hidden="true" />
                    <span>{selectedApp.seeker.location || "Location not set"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink/65">
                    <DollarSign className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                    <span>
                      Expected:{" "}
                      {formatPesoRange(
                        selectedApp.seeker.desiredSalaryMin,
                        selectedApp.seeker.desiredSalaryMax
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-xs text-ink/40">Your rating</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRating(value)}
                        className="rounded p-1 transition-colors hover:bg-ink/5"
                        aria-label={`Rate ${value} stars`}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            (selectedApp.rating ?? 0) >= value
                              ? "fill-marigold text-marigold"
                              : "text-ink/25"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-px bg-ink/5" />

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink/45">Cover Letter / Note</h4>
                <div className="rounded-xl border border-ink/5 bg-ink/2 p-4 text-xs italic leading-relaxed text-ink/80">
                  {selectedApp.coverNote || "No cover note provided by candidate."}
                </div>
              </div>

              <div className="h-px bg-ink/5" />

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink/45">Resume</h4>
                {selectedApp.seeker.resumeUrl ? (
                  <a
                    href={selectedApp.seeker.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 p-3 transition-all hover:border-teal/30 hover:bg-teal/5"
                  >
                    <Paperclip className="h-4 w-4 text-teal" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">View resume</p>
                      <p className="mt-0.5 text-[9px] text-ink/40">Opens in a new tab</p>
                    </div>
                  </a>
                ) : (
                  <p className="text-xs text-ink/45">No resume uploaded yet.</p>
                )}
              </div>

              <div className="h-px bg-ink/5" />

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink/45">Internal Notes</h4>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add an internal evaluation note for this candidate..."
                  rows={4}
                  className="w-full rounded-xl border border-ink/10 bg-white p-3 text-xs text-ink outline-none focus:border-teal"
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="cursor-pointer rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
                >
                  {savingNotes ? "Saving..." : "Save note"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
