"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  X,
  MessageSquare,
  ExternalLink,
  Download,
  ChevronDown,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CandidateDetailTabs from "./CandidateDetailTabs";
import CandidateOverviewTab from "./CandidateOverviewTab";
import CandidateApplicationTab from "./CandidateApplicationTab";
import CandidateNotesTab from "./CandidateNotesTab";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import type { CandidateApplication, CandidateDetailTab } from "./types";
import { PIPELINE } from "./types";
import { formatAppliedAt, stageIndex } from "./utils";

const STATUS_STYLES_FREE: Record<string, string> = {
  APPLIED: "bg-ink/8 text-ink/70",
  SHORTLISTED: "bg-navy/10 text-navy",
  INTERVIEW: "bg-teal/10 text-teal",
  HIRED: "bg-teal text-white",
  REJECTED: "bg-ink/10 text-ink/50",
};

const STATUS_STYLES_PRO: Record<string, string> = {
  APPLIED: "bg-ink/8 text-ink/70",
  SHORTLISTED: "bg-ink/8 text-ink/70",
  INTERVIEW: "bg-ink/8 text-ink",
  HIRED: "bg-teal text-white",
  REJECTED: "bg-ink/10 text-ink/50",
};

type Props = {
  application: CandidateApplication;
  navIndex: number;
  navTotal: number;
  noteInput: string;
  savingNotes: boolean;
  messageLoading: boolean;
  messageError: string;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onSaveNotes: () => void;
  onStatusChange: (status: string) => void;
  onRating: (rating: number) => void;
  onMessage: () => void;
  onNavigate: (direction: "prev" | "next") => void;
};

export default function CandidateDetailPanel({
  application,
  navIndex,
  navTotal,
  noteInput,
  savingNotes,
  messageLoading,
  messageError,
  onClose,
  onNoteChange,
  onSaveNotes,
  onStatusChange,
  onRating,
  onMessage,
  onNavigate,
}: Props) {
  const { isPro } = useEmployerShell();
  const { seeker } = application;
  const [tab, setTab] = useState<CandidateDetailTab>("overview");
  const statusStyles = isPro ? STATUS_STYLES_PRO : STATUS_STYLES_FREE;
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);
  const progress = stageIndex(application.status);
  const isRejected = application.status === "REJECTED";

  const stageOptions = [
    ...PIPELINE,
    { value: "REJECTED", label: "Rejected" },
    ...(isRejected ? [{ value: "APPLIED", label: "Restore" }] : []),
  ];

  function closeStageMenu(returnFocus = true) {
    setStageOpen(false);
    if (returnFocus) moveButtonRef.current?.focus();
  }

  function selectStage(status: string) {
    onStatusChange(status);
    closeStageMenu();
  }

  useEffect(() => {
    setTab("overview");
  }, [application.id]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) {
        setStageOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!stageOpen) return;

    function onMenuKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeStageMenu();
        return;
      }

      const menu = moveMenuRef.current;
      if (!menu) return;
      const items = Array.from(
        menu.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])')
      );
      if (items.length === 0) return;

      const currentIndex = items.findIndex((el) => el === document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(currentIndex + 1 + items.length) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    }

    document.addEventListener("keydown", onMenuKeyDown);
    const focusTimer = window.setTimeout(() => {
      moveMenuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]')?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onMenuKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [stageOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (stageOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        onNavigate("prev");
      }
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        onNavigate("next");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNavigate, stageOpen]);

  const statusLabel =
    PIPELINE.find((s) => s.value === application.status)?.label ??
    (isRejected ? "Rejected" : application.status);

  return (
    <div className="flex h-full min-h-0 flex-col bg-mist">
      {/* Header */}
      <div className="shrink-0 border-b border-ink/6 bg-white px-4 pb-3 pt-3">
        <div className="flex items-start gap-3">
          <EmployerAvatar
            name={seeker.fullName}
            imageUrl={seeker.photoUrl}
            size="md"
            shape="rounded"
            className={`!h-10 !w-10 !rounded-xl ring-1 ${isPro ? "ring-ink/10" : "ring-teal/10"}`}
            fallbackClassName={isPro ? "bg-ink/8 text-ink" : "bg-teal/10 text-teal"}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="truncate font-display text-base font-bold text-ink">{seeker.fullName}</h2>
                <p className="truncate text-xs text-ink/55">{seeker.headline || "Virtual Assistant"}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-ink/40">Applied {formatAppliedAt(application.appliedAt)}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[application.status] ?? statusStyles.APPLIED}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Stage stepper */}
        {!isRejected ? (
          <div className="mt-3">
            <div className="flex h-1 overflow-hidden rounded-full bg-ink/8">
              {PIPELINE.map((stage, i) => (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => onStatusChange(stage.value)}
                  title={stage.label}
                  className={`h-full flex-1 transition ${
                    i <= progress
                      ? isPro
                        ? stage.value === "HIRED"
                          ? "bg-teal"
                          : "bg-ink"
                        : "bg-teal"
                      : "bg-transparent hover:bg-ink/10"
                  }`}
                />
              ))}
            </div>
          <div className="mt-1 flex justify-between">
            {PIPELINE.map((stage, i) => (
              <button
                key={stage.value}
                type="button"
                onClick={() => onStatusChange(stage.value)}
                className={`max-w-[4rem] truncate text-xs font-medium transition ${
                  isPro ? "hover:text-ink" : "hover:text-teal"
                } ${
                  i === progress
                    ? isPro
                      ? stage.value === "HIRED"
                        ? "text-teal"
                        : "text-ink"
                      : "text-teal"
                    : i < progress
                      ? "text-ink/45"
                      : "text-ink/30"
                }`}
              >
                {stage.label}
              </button>
            ))}
          </div>
          </div>
        ) : (
          <p className="mt-2 rounded-lg bg-ink/5 px-2 py-1.5 text-center text-[10px] font-medium text-ink/55">
            Rejected — use Move stage to restore
          </p>
        )}

        {/* Actions — Pro: Message lives here so it stays on screen with the person */}
        <div className="mt-3 flex items-center gap-2">
          {navTotal > 1 ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigate("prev")}
                disabled={navIndex <= 0}
                className="rounded-lg p-1 text-ink/40 transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                aria-label="Previous candidate"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-data text-[10px] text-ink/40">
                {navIndex + 1} of {navTotal}
              </span>
              <button
                type="button"
                onClick={() => onNavigate("next")}
                disabled={navIndex >= navTotal - 1}
                className="rounded-lg p-1 text-ink/40 transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                aria-label="Next candidate"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {isPro && (
            <button
              type="button"
              onClick={onMessage}
              disabled={messageLoading}
              className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-ink shadow-sm shadow-marigold/20 transition hover:bg-marigold/90 disabled:opacity-50"
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              {messageLoading ? "Opening…" : "Message"}
            </button>
          )}

          {!isPro && navTotal <= 1 ? <span className="flex-1" /> : null}

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href={`/employer/talent/${seeker.id}`}
              className="rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
              title="View profile"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
            {seeker.resumeUrl && (
              <a
                href={`/api/employer/talent/${seeker.id}/resume`}
                className="rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink"
                title="Download resume"
              >
                <Download className="h-4 w-4" />
              </a>
            )}
            <div className="relative" ref={stageRef}>
              <button
                ref={moveButtonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={stageOpen}
                aria-controls={stageOpen ? "candidate-move-menu" : undefined}
                onClick={() => setStageOpen((v) => !v)}
                className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-ink/55 transition hover:bg-ink/5"
              >
                Move
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </button>
              {stageOpen && (
                <div
                  id="candidate-move-menu"
                  ref={moveMenuRef}
                  role="menu"
                  aria-label="Move candidate to stage"
                  className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-ink/8 bg-white py-1 shadow-lg"
                >
                  {stageOptions.map((stage) => (
                    <button
                      key={`${stage.value}-${stage.label}`}
                      type="button"
                      role="menuitem"
                      onClick={() => selectStage(stage.value)}
                      className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-ink/3 ${
                        application.status === stage.value
                          ? isPro
                            ? "text-ink"
                            : "text-teal"
                          : "text-ink/70"
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!isRejected && (
              <button
                type="button"
                onClick={() => onStatusChange("REJECTED")}
                className="rounded-lg p-1.5 text-ink/35 transition hover:bg-ember/5 hover:text-ember"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {isPro && messageError && (
          <p className="mt-1.5 text-xs text-ember">{messageError}</p>
        )}
      </div>

      <CandidateDetailTabs active={tab} onChange={setTab} />

      <div className="employer-tab-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {tab === "overview" && (
          <CandidateOverviewTab application={application} onRating={onRating} />
        )}
        {tab === "application" && <CandidateApplicationTab application={application} />}
        {tab === "notes" && (
          <CandidateNotesTab
            internalNotes={application.internalNotes}
            noteInput={noteInput}
            savingNotes={savingNotes}
            onNoteChange={onNoteChange}
            onSaveNotes={onSaveNotes}
          />
        )}
      </div>

      {/* Free keeps the sticky footer CTA. Pro Message lives in the header. */}
      {!isPro && (
        <div className="shrink-0 border-t border-ink/6 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(32,36,43,0.04)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={onMessage}
            disabled={messageLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition hover:bg-teal/95 disabled:opacity-50"
          >
            <MessageSquare className="h-4 w-4" />
            {messageLoading ? "Opening…" : "Message candidate"}
          </button>
          {messageError && <p className="mt-1.5 text-center text-xs text-ember">{messageError}</p>}
        </div>
      )}
    </div>
  );
}
