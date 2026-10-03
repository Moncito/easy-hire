"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import KanbanBoard from "./KanbanBoard";
import RejectCandidateModal from "./RejectCandidateModal";
import MakeOfferModal from "./MakeOfferModal";
import EmployerConfirmModal from "./EmployerConfirmModal";
import HireChoiceModal from "./HireChoiceModal";
import {
  createOffer,
  listApplicationOffers,
  sendGuaranteeInterest,
  withdrawOffer,
  type JobOffer,
} from "@/lib/client/offers";
import type { CreateOfferInput } from "@/lib/validations/offer";
import BulkApplicantActionsBar from "./BulkApplicantActionsBar";
import ApplicantsJobHeader, { type PipelineCounts } from "./ApplicantsJobHeader";
import type { ApplicantsJobSummary } from "./ApplicantsJobHeader";
import ApplicantsWorkspace from "./ApplicantsWorkspace";
import CandidateDetailPanel from "./candidate-detail/CandidateDetailPanel";
import type { CandidateApplication, PendingOfferSummary } from "./candidate-detail/types";
import { mergeApplicationUpdate } from "./candidate-detail/utils";
import { offerPrefill, openOffer } from "./candidate-detail/offer-view";
import { patchJobStatus } from "@/lib/client/jobs";
import { CheckSquare } from "lucide-react";
import { appendInternalNote } from "@/lib/candidate-notes";
import { patchApplication } from "@/lib/client/applications";
import { startConversation } from "@/lib/client/conversations";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import ProApplicantsJobHeader from "@/components/employer/pro-applicants/ProApplicantsJobHeader";
import ProBulkActionsBar from "@/components/employer/pro-applicants/ProBulkActionsBar";
import ProKanbanBoard from "@/components/employer/pro-applicants/ProKanbanBoard";
import ProCandidateDetailPanel from "@/components/employer/pro-applicants/ProCandidateDetailPanel";
import { waitSeverity } from "@/lib/employer/attention";

type Application = CandidateApplication;

type JobContext = ApplicantsJobSummary;

type Props = {
  job: JobContext;
  companyVerified: boolean;
  needsAttention?: boolean;
  employerName: string;
  initialApplications: Application[];
  /** Hiring-defaults rejection message; the reject dialog opens with it, still editable. */
  defaultRejectionMessage?: string | null;
  /** `?application=` from a deep link (e.g. the dashboard's Easy AI card): opens that candidate's panel on load. */
  initialSelectedId?: string | null;
  /** Render time from the server, for "waiting N days" on unreviewed candidates. */
  nowMs: number;
};

type PendingReject = {
  ids: string[];
  candidateName: string;
};

type PendingHire = {
  ids: string[];
  names: string[];
  hasOpenOffer: boolean;
};

/** The PENDING offers from a candidate's full offer list, in the shape the board carries on each application. */
function pendingSummaries(list: JobOffer[]): PendingOfferSummary[] {
  return list
    .filter((o) => o.status === "PENDING")
    .map((o) => ({
      id: o.id,
      status: o.status,
      expiresAt: o.expiresAt,
      monthlyRateCents: o.monthlyRateCents,
      hourlyRateCents: o.hourlyRateCents,
      currency: o.currency,
    }));
}

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
  defaultRejectionMessage,
  initialSelectedId = null,
  nowMs,
}: Props) {
  const { isPro } = useEmployerShell();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(
    () => initialApplications.find((a) => a.id === initialSelectedId) ?? null
  );
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
  const [pendingHire, setPendingHire] = useState<PendingHire | null>(null);
  const [closeJobOpen, setCloseJobOpen] = useState(false);
  const [closeJobLoading, setCloseJobLoading] = useState(false);

  useEffect(() => {
    if (selectedApp) setNoteInput("");
  }, [selectedApp?.id]);

  // Offers for the open candidate. Refetched when the selection changes; a
  // response for a candidate that is no longer selected is dropped.
  const selectedId = selectedApp?.id ?? null;
  // Offers are stored WITH the application id they were fetched for, so a
  // selection change hides the previous candidate's offers by derivation
  // rather than by resetting state inside an effect.
  const [offersFor, setOffersFor] = useState<{ applicationId: string; offers: JobOffer[] } | null>(null);
  const offers = offersFor && offersFor.applicationId === selectedId ? offersFor.offers : undefined;
  const offersLoading = selectedId != null && offers === undefined;
  // The make-offer dialog belongs to one candidate; navigating away closes it.
  const [makeOfferFor, setMakeOfferFor] = useState<string | null>(null);
  const makeOfferOpen = makeOfferFor != null && makeOfferFor === selectedId;
  const setMakeOfferOpen = (open: boolean) => setMakeOfferFor(open ? selectedId : null);
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [pendingWithdrawId, setPendingWithdrawId] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Keep the per-application pending-offer summary (card chip, next-step box)
  // in step with the full list whenever it is fetched.
  const storeOffers = useCallback((applicationId: string, list: JobOffer[]) => {
    setOffersFor({ applicationId, offers: list });
    const summary = pendingSummaries(list);
    setApplications((prev) => prev.map((app) => (app.id === applicationId ? { ...app, offers: summary } : app)));
    setSelectedApp((prev) => (prev?.id === applicationId ? { ...prev, offers: summary } : prev));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let stale = false;
    listApplicationOffers(selectedId)
      .then((list) => {
        if (!stale) storeOffers(selectedId, list);
      })
      .catch(() => {
        // Keep the board's pending-offer summary; the panel falls back to it.
      });
    return () => {
      stale = true;
    };
  }, [selectedId, storeOffers]);

  async function refreshOffers(applicationId: string) {
    try {
      const list = await listApplicationOffers(applicationId);
      storeOffers(applicationId, list);
    } catch {
      // Keep what is on screen; the next selection change refetches.
    }
  }

  async function handleSubmitOffer(input: CreateOfferInput) {
    if (!selectedApp) return;
    const applicationId = selectedApp.id;
    setOfferSubmitting(true);
    setOfferError("");
    try {
      await createOffer(applicationId, input);
      setMakeOfferOpen(false);
      toast.success("Offer sent");
      await refreshOffers(applicationId);
    } catch (err) {
      setOfferError(err instanceof Error ? err.message : "Could not send the offer");
      // A 409 means an offer is already open — show it.
      void refreshOffers(applicationId);
    } finally {
      setOfferSubmitting(false);
    }
  }

  async function handleConfirmWithdraw() {
    if (!pendingWithdrawId || !selectedApp) return;
    const applicationId = selectedApp.id;
    setWithdrawLoading(true);
    try {
      await withdrawOffer(pendingWithdrawId);
      toast.success("Offer withdrawn");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw the offer");
    } finally {
      setWithdrawLoading(false);
      setPendingWithdrawId(null);
    }
    await refreshOffers(applicationId);
  }

  async function handleGuaranteeInterest(): Promise<boolean> {
    if (!selectedApp) return false;
    try {
      await sendGuaranteeInterest(selectedApp.id);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record your interest");
      return false;
    }
  }

  const cancelWithdraw = useCallback(() => setPendingWithdrawId(null), []);
  const offerProps = {
    offers,
    offersLoading,
    onMakeOffer: () => {
      setOfferError("");
      setMakeOfferOpen(true);
    },
    onWithdrawOffer: (offerId: string) => setPendingWithdrawId(offerId),
    onGuaranteeInterest: handleGuaranteeInterest,
  };

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

    if (newStatus === "HIRED") {
      const app = applications.find((a) => a.id === id);
      if (app && app.status !== "HIRED") {
        setPendingHire({
          ids: [id],
          names: [app.seeker.fullName || "this candidate"],
          hasOpenOffer: openOffer(app, nowMs) !== null,
        });
        return;
      }
    }

    await runStatusChange(id, newStatus);
  }

  async function runStatusChange(id: string, newStatus: string) {
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

    if (status === "HIRED") {
      const targets = applications.filter((a) => selectedIds.has(a.id) && a.status !== "HIRED");
      if (targets.length > 0) {
        setPendingHire({
          ids: targets.map((a) => a.id),
          names: targets.map((a) => a.seeker.fullName || "this candidate"),
          hasOpenOffer: targets.length === 1 && openOffer(targets[0], nowMs) !== null,
        });
        return;
      }
    }

    await runBulkMove(Array.from(selectedIds), status);
  }

  async function runBulkMove(ids: string[], status: string) {
    setBulkLoading(true);
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

  async function confirmMarkHired() {
    if (!pendingHire) return;
    const { ids } = pendingHire;
    setPendingHire(null);
    if (ids.length === 1) await runStatusChange(ids[0], "HIRED");
    else await runBulkMove(ids, "HIRED");
  }

  function sendOfferFromHireChoice() {
    if (!pendingHire || pendingHire.ids.length !== 1) return;
    const target = applications.find((a) => a.id === pendingHire.ids[0]);
    setPendingHire(null);
    if (!target) return;
    setSelectedApp(target);
    setOfferError("");
    setMakeOfferFor(target.id);
  }

  async function handleCloseJob() {
    setCloseJobLoading(true);
    try {
      const result = await patchJobStatus(job.id, "CLOSED");
      if (result.ok) {
        toast.success("Job closed");
        setCloseJobOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close the job");
    } finally {
      setCloseJobLoading(false);
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

      router.push(`/employer/messages?c=${(result.data as { id: string }).id}`);
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

  // Facts the after-hire checklist needs ("2 of 2 hired — close this job?").
  const hireProps = {
    hiredCount: livePipeline.hired,
    targetHireCount: job.targetHireCount,
    jobStatus: job.status,
    onCloseJob: () => setCloseJobOpen(true),
  };

  // The oldest unreviewed wait, for the header badge (same rule as the job cards).
  const oldestAppliedMs = applications
    .filter((a) => a.status === "APPLIED")
    .reduce((min, a) => Math.min(min, new Date(a.appliedAt).getTime()), Infinity);
  const headerSeverity = waitSeverity(
    Number.isFinite(oldestAppliedMs) ? Math.floor((nowMs - oldestAppliedMs) / (24 * 60 * 60 * 1000)) : null
  );

  const bulkReject = () => {
    if (selectedIds.size > 0) {
      setPendingReject({
        ids: Array.from(selectedIds),
        candidateName: `${selectedIds.size} candidates`,
      });
    }
  };

  const openCard = (app: Application) => {
    if (selectionMode) return;
    if (selectedApp?.id === app.id) setSelectedApp(null);
    else setSelectedApp(app);
  };

  const proBoard = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 sm:px-5">
        <ProApplicantsJobHeader
          job={job}
          totalApplicants={applications.length}
          pipeline={livePipeline}
          companyVerified={companyVerified}
          waitSeverity={headerSeverity}
          activeStage={activeStage}
          onStageSelect={handleStageSelect}
          selectionMode={selectionMode}
          onToggleSelection={() => {
            if (selectionMode) clearSelection();
            else setSelectionMode(true);
          }}
        />
        <ProBulkActionsBar
          selectedCount={selectedIds.size}
          loading={bulkLoading || rejectLoading}
          onClear={clearSelection}
          onMove={handleBulkMove}
          onReject={bulkReject}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-3 sm:px-5">
        <ProKanbanBoard
          applications={applications}
          job={job}
          companyVerified={companyVerified}
          nowMs={nowMs}
          activeStage={activeStage}
          focusedApplicationId={selectedApp?.id ?? null}
          onCardClick={openCard}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      </div>
    </div>
  );

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
      isPro ? (
        <ProCandidateDetailPanel
          application={selectedApp}
          navIndex={navIndex}
          navTotal={applications.length}
          noteInput={noteInput}
          savingNotes={savingNotes}
          messageLoading={messageLoading}
          messageError={messageError}
          nowMs={nowMs}
          onClose={() => setSelectedApp(null)}
          onNoteChange={setNoteInput}
          onSaveNotes={handleSaveNotes}
          onStatusChange={(status) => handleStatusChange(selectedApp.id, status)}
          onRating={handleRating}
          onMessage={handleMessageCandidate}
          onNavigate={navigateCandidate}
          {...offerProps}
          {...hireProps}
        />
      ) : (
      <CandidateDetailPanel
        application={selectedApp}
        navIndex={navIndex}
        navTotal={applications.length}
        noteInput={noteInput}
        savingNotes={savingNotes}
        messageLoading={messageLoading}
        messageError={messageError}
        nowMs={nowMs}
        onClose={() => setSelectedApp(null)}
        onNoteChange={setNoteInput}
        onSaveNotes={handleSaveNotes}
        onStatusChange={(status) => handleStatusChange(selectedApp.id, status)}
        onRating={handleRating}
        onMessage={handleMessageCandidate}
        onNavigate={navigateCandidate}
        {...offerProps}
        {...hireProps}
      />
      )
    ) : null;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ApplicantsWorkspace
        panelOpen={!!selectedApp}
        onClosePanel={() => setSelectedApp(null)}
        board={
          isPro ? (
            proBoard
          ) : (
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
                nowMs={nowMs}
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
          )
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
        defaultReason={defaultRejectionMessage ?? ""}
      />

      <MakeOfferModal
        open={makeOfferOpen && !!selectedApp}
        candidateName={selectedApp?.seeker.fullName || "this candidate"}
        jobTitle={job.title}
        prefill={offerPrefill(job)}
        loading={offerSubmitting}
        error={offerError}
        onCancel={() => {
          setMakeOfferOpen(false);
          setOfferError("");
        }}
        onSubmit={handleSubmitOffer}
      />

      <HireChoiceModal
        open={!!pendingHire}
        candidateNames={pendingHire?.names ?? []}
        hasOpenOffer={pendingHire?.hasOpenOffer ?? false}
        onSendOffer={pendingHire && pendingHire.ids.length === 1 ? sendOfferFromHireChoice : undefined}
        onMarkHired={confirmMarkHired}
        onCancel={() => setPendingHire(null)}
      />

      <EmployerConfirmModal
        open={closeJobOpen}
        title="Close this job?"
        subject={job.title}
        description="The listing comes down and no new applications come in. You can still message candidates."
        confirmLabel="Close job"
        loading={closeJobLoading}
        onCancel={() => setCloseJobOpen(false)}
        onConfirm={handleCloseJob}
      />

      <EmployerConfirmModal
        open={pendingWithdrawId !== null}
        title="Withdraw this offer?"
        subject={selectedApp?.seeker.fullName}
        description="The candidate will no longer be able to accept it. You can send a new offer afterwards."
        confirmLabel="Withdraw offer"
        danger
        loading={withdrawLoading}
        onCancel={cancelWithdraw}
        onConfirm={handleConfirmWithdraw}
      />
    </div>
  );
}
