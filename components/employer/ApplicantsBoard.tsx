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
import { patchApplication } from "@/lib/client/applications";
import { startConversation } from "@/lib/client/conversations";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

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
  const { isPro } = useEmployerShell();
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

  async function patchApplicationLocal(id: string, body: Record<string, unknown>) {
    try {
      return await patchApplication(id, body);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Update failed");
    }
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
      const updated = await patchApplicationLocal(id, { status: newStatus });
      syncUpdated(id, updated as Partial<Application>);
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
          patchApplicationLocal(id, {
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
      const results = await Promise.all(ids.map((id) => patchApplicationLocal(id, { status })));
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
      const updated = await patchApplicationLocal(selectedApp.id, { internalNotes: merged });
      syncUpdated(selectedApp.id, {
        internalNotes: updated.internalNotes as string | null | undefined,
        updatedAt: updated.updatedAt as string | undefined,
      });
      setNoteInput("");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleRating(rating: number) {
    if (!selectedApp) return;
    const nextRating = selectedApp.rating === rating ? null : rating;
    const updated = await patchApplicationLocal(selectedApp.id, { rating: nextRating });
      syncUpdated(selectedApp.id, updated as Partial<Application>);
  }

  async function handleMessageCandidate() {
    if (!selectedApp) return;
    setMessageError("");
    setMessageLoading(true);

    try {
      const result = await startConversation(selectedApp.seeker.id, job.id);

      if (!result.ok) {
        setMessageError(result.error || "Could not start conversation");
        return;
      }

      window.location.href = `/employer/messages?c=${(result.data as { id: string }).id}`;
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
          ? isPro
            ? "border-marigold/40 bg-marigold/15 text-ink"
            : "border-teal/30 bg-teal/8 text-teal"
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
            <div className="shrink-0 px-4 pt-4 sm:px-5">
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

            <div className="min-h-0 flex-1 overflow-hidden px-4 pb-3 sm:px-5">
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
