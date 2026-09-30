"use client";

import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  MessageSquare,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react";
import {
  ApplicationStatusBadge,
  Avatar,
  Button,
  DropdownMenu,
  IconButton,
  cx,
  type MenuItem,
} from "@/components/employer/system";
import CandidateOverviewTab from "@/components/employer/candidate-detail/CandidateOverviewTab";
import CandidateApplicationTab from "@/components/employer/candidate-detail/CandidateApplicationTab";
import CandidateNotesTab from "@/components/employer/candidate-detail/CandidateNotesTab";
import type { CandidateApplication, CandidateDetailTab } from "@/components/employer/candidate-detail/types";
import { PIPELINE } from "@/components/employer/candidate-detail/types";
import { formatAppliedAt, stageIndex } from "@/components/employer/candidate-detail/utils";
import { PRO_STAGES } from "@/components/employer/pro-applicants/stages";
import { waitSeverity } from "@/lib/employer/attention";

const TABS: { id: CandidateDetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "application", label: "Application" },
  { id: "notes", label: "Notes" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

type Props = {
  application: CandidateApplication;
  navIndex: number;
  navTotal: number;
  noteInput: string;
  savingNotes: boolean;
  messageLoading: boolean;
  messageError: string;
  /** Render time from the server, for the "waiting N days" line. */
  nowMs: number;
  onClose: () => void;
  onNoteChange: (value: string) => void;
  onSaveNotes: () => void;
  onStatusChange: (status: string) => void;
  onRating: (rating: number) => void;
  onMessage: () => void;
  onNavigate: (direction: "prev" | "next") => void;
};

/**
 * Pro candidate panel. Same props and behaviour as CandidateDetailPanel —
 * stage moves, rejection (through the board's confirmation), rating,
 * notes, messaging, previous/next — laid out on the design system:
 *
 *   who they are, their stage, how long they've waited
 *   stage stepper (click a stage to move them)
 *   [ Message ]  ↑ ↓  ⋯ (profile, resume, move, reject / restore)
 *   Overview | Application | Notes
 *
 * Keyboard: Escape closes, ↑/↓ or j/k step through candidates — except
 * while a menu is open or you're typing.
 */
export default function ProCandidateDetailPanel({
  application,
  navIndex,
  navTotal,
  noteInput,
  savingNotes,
  messageLoading,
  messageError,
  nowMs,
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
  const [shownFor, setShownFor] = useState(application.id);
  const progress = stageIndex(application.status);
  const isRejected = application.status === "REJECTED";

  // Each candidate opens on Overview. Reset during render, not in an effect.
  if (shownFor !== application.id) {
    setShownFor(application.id);
    setTab("overview");
  }

  const waitingDays =
    application.status === "APPLIED" ? Math.floor((nowMs - new Date(application.appliedAt).getTime()) / DAY_MS) : null;
  const severity = waitSeverity(waitingDays);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // A menu handles its own keys; typing in notes shouldn't navigate.
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable) return;
      if (target?.closest?.('[role="menu"]')) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        onNavigate("prev");
      } else if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        onNavigate("next");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onNavigate]);

  const menuItems: MenuItem[] = [
    { label: "View full profile", icon: <UserRound />, href: `/employer/talent/${seeker.id}` },
    {
      label: "Download resume",
      icon: <Download />,
      href: `/api/employer/talent/${seeker.id}/resume`,
      native: true,
      hidden: !seeker.resumeUrl,
    },
    ...PIPELINE.filter((s) => s.value !== application.status && !isRejected).map((s, i) => ({
      label: `Move to ${s.label}`,
      icon: <ArrowRightLeft />,
      onSelect: () => onStatusChange(s.value),
      separatorBefore: i === 0,
    })),
    isRejected
      ? { label: "Restore to Applied", icon: <RotateCcw />, onSelect: () => onStatusChange("APPLIED"), separatorBefore: true }
      : { label: "Reject candidate", icon: <X />, onSelect: () => onStatusChange("REJECTED"), tone: "danger", separatorBefore: true },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-eh-surface-2">
      <div className="shrink-0 border-b border-eh-line bg-eh-surface px-5 pb-4 pt-4">
        <div className="flex items-start gap-3">
          <Avatar name={seeker.fullName} src={seeker.photoUrl} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[18px] font-semibold leading-snug text-eh-ink">{seeker.fullName}</h2>
            <p className="truncate text-small text-eh-muted">{seeker.headline || "Virtual Assistant"}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ApplicationStatusBadge status={application.status} />
              {severity !== "none" ? (
                <span
                  className={cx(
                    "num inline-flex items-center gap-1 text-small font-semibold",
                    severity === "critical" ? "text-eh-danger" : "text-eh-marigold-ink"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Waiting {waitingDays} days
                </span>
              ) : (
                <span className="text-small text-eh-muted">Applied {formatAppliedAt(application.appliedAt)}</span>
              )}
            </div>
          </div>
          <IconButton aria-label="Close candidate panel" title="Close (Esc)" icon={<X />} onClick={onClose} />
        </div>

        {isRejected ? (
          <p className="mt-4 rounded-control border border-eh-line bg-eh-surface-2 px-3 py-2 text-small text-eh-ink-2">
            Rejected. Use <span className="font-semibold">⋯ → Restore to Applied</span> to bring them back.
          </p>
        ) : (
          <div role="group" aria-label="Move to stage" className="mt-4 grid grid-cols-4 gap-1">
            {PRO_STAGES.map((stage, i) => {
              const reached = i <= progress;
              // Progress is one colour: ink while still unreviewed, teal once
              // they've moved on, darkest teal when hired.
              const fill = progress === 0 ? "bg-eh-ink" : progress === 3 ? "bg-eh-teal-ink" : "bg-eh-teal";
              const current = i === progress;
              return (
                <button
                  key={stage.status}
                  type="button"
                  onClick={() => !current && onStatusChange(stage.status)}
                  aria-current={current ? "step" : undefined}
                  title={current ? `${stage.label} (current)` : `Move to ${stage.label}`}
                  className="group flex flex-col gap-1.5 rounded-chip pt-1 text-left"
                >
                  <span
                    className={cx(
                      "h-1.5 w-full rounded-full transition-colors duration-150",
                      reached ? fill : "bg-eh-line group-hover:bg-[color-mix(in_srgb,var(--eh-ink)_18%,var(--eh-line))]"
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cx(
                      "truncate text-small transition-colors duration-150",
                      current ? "font-semibold text-eh-ink" : reached ? "text-eh-ink-2" : "text-eh-muted group-hover:text-eh-ink"
                    )}
                  >
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button
            size="lg"
            variant="primary"
            icon={<MessageSquare />}
            loading={messageLoading}
            onClick={onMessage}
            className="flex-1"
          >
            {messageLoading ? "Opening…" : "Message"}
          </Button>
          {navTotal > 1 && (
            <div className="flex items-center" role="group" aria-label="Candidate navigation">
              <IconButton
                size="lg"
                aria-label="Previous candidate"
                title="Previous (↑ or K)"
                icon={<ChevronUp />}
                disabled={navIndex <= 0}
                onClick={() => onNavigate("prev")}
              />
              <span className="num w-12 text-center text-small text-eh-muted" aria-live="polite">
                {navIndex + 1} / {navTotal}
              </span>
              <IconButton
                size="lg"
                aria-label="Next candidate"
                title="Next (↓ or J)"
                icon={<ChevronDown />}
                disabled={navIndex >= navTotal - 1}
                onClick={() => onNavigate("next")}
              />
            </div>
          )}
          <DropdownMenu
            label={`More actions for ${seeker.fullName}`}
            tooltip="More actions"
            triggerVariant="outline"
            triggerSize="lg"
            items={menuItems}
          />
        </div>
        {messageError && (
          <p role="alert" className="mt-2 text-small text-eh-danger">
            {messageError}
          </p>
        )}
      </div>

      <div role="tablist" aria-label="Candidate details" className="flex shrink-0 gap-1 border-b border-eh-line bg-eh-surface px-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`candidate-tab-${t.id}`}
              aria-selected={active}
              aria-controls="candidate-tabpanel"
              onClick={() => setTab(t.id)}
              className={cx(
                "relative px-3 py-2.5 text-ui transition-colors duration-150",
                active ? "font-semibold text-eh-ink" : "text-eh-muted hover:text-eh-ink"
              )}
            >
              {t.label}
              {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-eh-marigold" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div
        id="candidate-tabpanel"
        role="tabpanel"
        aria-labelledby={`candidate-tab-${tab}`}
        className="employer-tab-fade min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3"
      >
        {tab === "overview" && <CandidateOverviewTab application={application} onRating={onRating} />}
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
    </div>
  );
}
