"use client";

import { Paperclip } from "lucide-react";
import { displaySkill } from "@/lib/seeker/profile-format";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { PRO_STAGE_CARD_ACCENT } from "@/components/employer/pipeline-stage-styles";

type Application = {
  id: string;
  status: string;
  coverNote: string | null;
  appliedAt: string;
  seeker: {
    id: string;
    fullName: string;
    headline: string | null;
    photoUrl?: string | null;
    skills: string[];
    resumeUrl: string | null;
  };
};

type Props = {
  application: Application;
  selected?: boolean;
  focused?: boolean;
  dimmed?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onClick: () => void;
};

function formatAppliedAt(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Applied just now";
  if (diffHours < 24) return `Applied ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Applied ${diffDays}d ago`;
  return `Applied ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export default function CandidateCard({
  application,
  selected = false,
  focused = false,
  dimmed = false,
  selectionMode = false,
  onToggleSelect,
  onClick,
}: Props) {
  const { isPro } = useEmployerShell();
  const skills = application.seeker.skills ?? [];
  const stageAccent = isPro ? (PRO_STAGE_CARD_ACCENT[application.status] ?? "") : "";

  function handleClick() {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(application.id);
      return;
    }
    onClick();
  }

  return (
    <div
      className={`group w-full rounded-lg border bg-white p-3.5 text-left transition-all duration-200 ${
        isPro ? "focus-within:ring-2 focus-within:ring-marigold/35" : "focus-within:ring-2 focus-within:ring-teal/30"
      } ${stageAccent} ${
        selected
          ? isPro
            ? "border-marigold/50 bg-marigold/[0.06] ring-2 ring-marigold/25 shadow-md"
            : "border-teal/40 bg-teal/3 ring-2 ring-teal/20 shadow-md"
          : focused
            ? isPro
              ? "border-marigold/50 ring-2 ring-marigold/30 shadow-md"
              : "border-teal/50 ring-2 ring-teal/30 shadow-md"
            : dimmed
              ? "border-ink/5 opacity-55 hover:opacity-80"
              : isPro
                ? "border-ink/6 hover:border-ink/15 hover:shadow-md"
                : "border-ink/6 hover:border-teal/20 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-2">
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(application.id)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 shrink-0 rounded border-ink/20 text-teal focus:ring-teal/30"
            aria-label={`Select ${application.seeker.fullName}`}
          />
        )}
        <button
          type="button"
          onClick={handleClick}
          className="min-w-0 flex-1 text-left focus-visible:outline-none"
        >
          <div className="flex items-start gap-3">
            <EmployerAvatar
              name={application.seeker.fullName}
              imageUrl={application.seeker.photoUrl}
              size="md"
              shape="rounded"
              className="!rounded-xl transition-transform group-hover:scale-105"
              fallbackClassName={isPro ? "bg-ink/8 text-ink ring-1 ring-ink/10" : "bg-teal/10 text-teal ring-1 ring-teal/10"}
            />
            <div className="min-w-0 flex-1">
              <h4 className={`truncate font-display text-sm font-bold text-ink ${isPro ? "group-hover:text-ink" : "group-hover:text-teal"}`}>
                {application.seeker.fullName}
              </h4>
              <p className="mt-0.5 truncate text-xs text-ink/50">
                {application.seeker.headline || "Virtual Assistant"}
              </p>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-ink/4 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink/60"
                >
                  {displaySkill(skill)}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="rounded-md bg-ink/4 px-1.5 py-0.5 text-[9px] font-semibold text-ink/40">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-2.5">
            <span className="text-[10px] font-medium text-ink/40">
              {formatAppliedAt(application.appliedAt)}
            </span>
            {application.seeker.resumeUrl && (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                  isPro ? "bg-ink/6 text-ink/60" : "bg-teal/8 text-teal"
                }`}
                title="Resume attached"
              >
                <Paperclip className="h-3 w-3" aria-hidden="true" />
                Resume
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
