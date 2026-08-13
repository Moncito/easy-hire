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
import type { CandidateApplication, CandidateDetailTab } from "./types";
import { PIPELINE } from "./types";
import { formatAppliedAt, stageIndex } from "./utils";

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-ink/8 text-ink/70",
  SHORTLISTED: "bg-navy/10 text-navy",
  INTERVIEW: "bg-teal/10 text-teal",
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
  const { seeker } = application;
  const [tab, setTab] = useState<CandidateDetailTab>("overview");
  const [stageOpen, setStageOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const progress = stageIndex(application.status);
  const isRejected = application.status === "REJECTED";

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
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
  }, [onClose, onNavigate]);

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
            className="!h-10 !w-10 !rounded-xl ring-1 ring-teal/10"
            fallbackClassName="bg-teal/10 text-teal"
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
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[application.status] ?? STATUS_STYLES.APPLIED}`}
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
                  className={`h-full flex-1 transition ${i <= progress ? "bg-teal" : "bg-transparent hover:bg-ink/10"}`}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between">
              {PIPELINE.map((stage, i) => (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() => onStatusChange(stage.value)}
                  className={`text-[9px] font-medium transition hover:text-teal ${
                    i === progress ? "text-teal" : i < progress ? "text-ink/45" : "text-ink/30"
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

        {/* Nav + actions row */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {navTotal > 1 ? (
            <div className="flex items-center gap-1">
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
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1">
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
                type="button"
                onClick={() => setStageOpen((v) => !v)}
                className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-ink/55 transition hover:bg-ink/5"
              >
                Move
                <ChevronDown className="h-3 w-3" />
              </button>
              {stageOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl border border-ink/8 bg-white py-1 shadow-lg">
                  {[...PIPELINE, { value: "REJECTED", label: "Rejected" }].map((stage) => (
                    <button
                      key={stage.value}
                      type="button"
                      onClick={() => {
                        onStatusChange(stage.value);
                        setStageOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-xs font-medium hover:bg-ink/3 ${
                        application.status === stage.value ? "text-teal" : "text-ink/70"
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                  {isRejected && (
                    <button
                      type="button"
                      onClick={() => {
                        onStatusChange("APPLIED");
                        setStageOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-xs font-medium text-ink/70 hover:bg-ink/3"
                    >
                      Restore
                    </button>
                  )}
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

      {/* Sticky footer — single primary CTA */}
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
    </div>
  );
}
