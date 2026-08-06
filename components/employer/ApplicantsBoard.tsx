"use client";

import { useEffect, useState, useCallback } from "react";
import KanbanBoard from "./KanbanBoard";
import RejectCandidateModal from "./RejectCandidateModal";
import BulkApplicantActionsBar from "./BulkApplicantActionsBar";
import ApplicantsJobHeader, { type PipelineCounts } from "./ApplicantsJobHeader";
import type { ApplicantsJobSummary } from "./ApplicantsJobHeader";
import ApplicantsWorkspace from "./ApplicantsWorkspace";
import CandidateDetailPanel from "./candidate-detail/CandidateDetailPanel";
import type { CandidateApplication } from "./candidate-detail/types";
import { mergeApplicationUpdate } from "./candidate-detail/utils";
import { CheckSquare } from "lucide-react";
import { appendInternalNote } from "@/lib/candidate-notes";

type Application = CandidateApplication;

type JobContext = ApplicantsJobSummary;

type Props = {
  job: JobContext;
  companyVerified: boolean;
  needsAttention?: boolean;
  employerName: string;
  initialApplications: Application[];
};

type PendingReject = {
  ids: string[];
  candidateName: string;
};

function applyUpdate(
  apps: Application[],
  id: string,
  updated: Partial<Application>
): Application[] {
  return apps.map((app) => (app.id === id ? mergeApplicationUpdate(app, updated) : app));
}

export default function ApplicantsBoard({
  job,
  companyVerified,
  needsAttention = false,
  employerName,
  initialApplications,
}: Props) {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [noteInput, setNoteInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [pendingReject, setPendingReject] = useState<PendingReject | null>(null);
  const [messageLoading, setMessageLoading] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [rejectError, setRejectError] = useState("");

  useEffect(() => {
    if (selectedApp) setNoteInput("");
  }, [selectedApp?.id]);

  const navIndex = selectedApp ? applications.findIndex((a) => a.id === selectedApp.id) : -1;

  const navigateCandidate = useCallback(
    (direction: "prev" | "next") => {
      if (navIndex < 0) return;
      const nextIndex = direction === "prev" ? navIndex - 1 : navIndex + 1;
      const next = applications[nextIndex];
      if (next) setSelectedApp(next);
    },
    [applications, navIndex]
  );

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

    return res.json() as Promise<Partial<Application>>;
  }

  function syncUpdated(id: string, updated: Partial<Application>) {
    setApplications((prev) => applyUpdate(prev, id, updated));
    setSelectedApp((prev) => (prev?.id === id ? mergeApplicationUpdate(prev, updated) : prev));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  async function handleStatusChange(id: string, newStatus: string) {
    if (newStatus === "REJECTED") {
      const app = applications.find((a) => a.id === id);
      setPendingReject({
        ids: [id],
        candidateName: app?.seeker.fullName || "this candidate",
      });
      return;
    }

    const previous = applications;
    const previousSelected = selectedApp;
    setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const updated = await patchApplication(id, { status: newStatus });
      syncUpdated(id, updated);
    } catch {
      setApplications(previous);
      setSelectedApp(previousSelected);
    }
  }

  async function confirmReject(reason: string) {
    if (!pendingReject) return;
    setRejectLoading(true);
    setRejectError("");

    const previous = applications;
    const previousSelected = selectedApp;
    const ids = pendingReject.ids;

    setApplications((prev) =>
      prev.map((app) => (ids.includes(app.id) ? { ...app, status: "REJECTED" } : app))
    );

    try {
      const results = await Promise.all(
        ids.map((id) =>
          patchApplication(id, {
            status: "REJECTED",
            rejectionReason: reason || null,
          })
        )
      );

      setApplications((prev) =>
        prev.map((app) => {
          const updated = results.find((r) => r.id === app.id);
          return updated ? mergeApplicationUpdate(app, updated) : app;
        })
      );

      if (selectedApp && ids.includes(selectedApp.id)) {
        const updated = results.find((r) => r.id === selectedApp.id);
        if (updated) setSelectedApp((prev) => (prev ? mergeApplicationUpdate(prev, updated) : null));
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setPendingReject(null);
    } catch (err) {
      setApplications(previous);
      setSelectedApp(previousSelected);
      setRejectError(err instanceof Error ? err.message : "Rejection failed");
    } finally {
      setRejectLoading(false);
    }
  }

  async function handleBulkMove(status: string) {
    if (selectedIds.size === 0) return;

    if (status === "REJECTED") {
      setPendingReject({
        ids: Array.from(selectedIds),
        candidateName: `${selectedIds.size} candidates`,
      });
      return;
    }

    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const previous = applications;

    setApplications((prev) =>
      prev.map((app) => (ids.includes(app.id) ? { ...app, status } : app))
    );

    try {
      const results = await Promise.all(ids.map((id) => patchApplication(id, { status })));
      setApplications((prev) =>
        prev.map((app) => {
          const updated = results.find((r) => r.id === app.id);
          return updated ? mergeApplicationUpdate(app, updated) : app;
        })
      );
      clearSelection();
    } catch {
      setApplications(previous);
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleSaveNotes() {
    if (!selectedApp || !noteInput.trim()) return;
    setSavingNotes(true);
    try {
      const merged = appendInternalNote(
        selectedApp.internalNotes,
        employerName,
        noteInput.trim()
      );
      const updated = await patchApplication(selectedApp.id, { internalNotes: merged });
      syncUpdated(selectedApp.id, {
        internalNotes: updated.internalNotes,
        updatedAt: updated.updatedAt,
      });
      setNoteInput("");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleRating(rating: number) {
    if (!selectedApp) return;
    const nextRating = selectedApp.rating === rating ? null : rating;
    const updated = await patchApplication(selectedApp.id, { rating: nextRating });
    syncUpdated(selectedApp.id, updated);
  }

  async function handleMessageCandidate() {
    if (!selectedApp) return;
    setMessageError("");
    setMessageLoading(true);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seekerId: selectedApp.seeker.id, jobId: job.id }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessageError((result as { error?: string }).error || "Could not start conversation");
        return;
      }

      window.location.href = `/employer/messages?c=${(result as { id: string }).id}`;
    } catch {
      setMessageError("Could not start conversation");
    } finally {
      setMessageLoading(false);
    }
  }

  function handleStageSelect(stage: string) {
    setActiveStage(stage);
    const el = document.getElementById(`kanban-col-${stage}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  const hasApplicants = applications.length > 0;

  const livePipeline: PipelineCounts = {
    applied: applications.filter((a) => a.status === "APPLIED").length,
    shortlisted: applications.filter((a) => a.status === "SHORTLISTED").length,
    interview: applications.filter((a) => a.status === "INTERVIEW").length,
    hired: applications.filter((a) => a.status === "HIRED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  const toolbar = hasApplicants ? (
    <button
      type="button"
      onClick={() => {
        setSelectionMode((v) => !v);
        if (selectionMode) clearSelection();
      }}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${
        selectionMode
          ? "border-teal/30 bg-teal/8 text-teal"
          : "border-ink/10 bg-white text-ink/70 hover:border-ink/20"
      }`}
    >
      <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
      {selectionMode ? "Exit selection" : "Select candidates"}
    </button>
  ) : null;

  const panel =
    selectedApp && navIndex >= 0 ? (
      <CandidateDetailPanel
        application={selectedApp}
        navIndex={navIndex}
        navTotal={applications.length}
        noteInput={noteInput}
        savingNotes={savingNotes}
        messageLoading={messageLoading}
        messageError={messageError}
        onClose={() => setSelectedApp(null)}
        onNoteChange={setNoteInput}
        onSaveNotes={handleSaveNotes}
        onStatusChange={(status) => handleStatusChange(selectedApp.id, status)}
        onRating={handleRating}
        onMessage={handleMessageCandidate}
        onNavigate={navigateCandidate}
      />
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ApplicantsWorkspace
        panelOpen={!!selectedApp}
        onClosePanel={() => setSelectedApp(null)}
        board={
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0">
              <ApplicantsJobHeader
                job={job}
                totalApplicants={applications.length}
                pipeline={livePipeline}
                companyVerified={companyVerified}
                needsAttention={needsAttention}
                activeStage={activeStage}
                onStageSelect={handleStageSelect}
                toolbar={toolbar}
              />

              <BulkApplicantActionsBar
                selectedCount={selectedIds.size}
                loading={bulkLoading || rejectLoading}
                onClear={clearSelection}
                onMove={handleBulkMove}
                onReject={() => {
                  if (selectedIds.size > 0) {
                    setPendingReject({
                      ids: Array.from(selectedIds),
                      candidateName: `${selectedIds.size} candidates`,
                    });
                  }
                }}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              <KanbanBoard
                applications={applications}
                job={job}
                companyVerified={companyVerified}
                activeStage={activeStage}
                focusedApplicationId={selectedApp?.id ?? null}
                onCardClick={(app) => {
                  if (selectionMode) return;
                  if (selectedApp?.id === app.id) setSelectedApp(null);
                  else setSelectedApp(app as Application);
                }}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </div>
          </div>
        }
        panel={panel}
      />

      <RejectCandidateModal
        open={!!pendingReject}
        candidateName={pendingReject?.candidateName || ""}
        loading={rejectLoading}
        error={rejectError}
        onCancel={() => {
          setPendingReject(null);
          setRejectError("");
        }}
        onConfirm={confirmReject}
      />
    </div>
  );
}
