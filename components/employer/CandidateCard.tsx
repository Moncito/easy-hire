"use client";

import { Paperclip } from "lucide-react";

type Application = {
  id: string;
  status: string;
  coverNote: string | null;
  appliedAt: string;
  seeker: {
    id: string;
    fullName: string;
    headline: string | null;
    skills: string[];
    resumeUrl: string | null;
  };
};

type Props = {
  application: Application;
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

export default function CandidateCard({ application, onClick }: Props) {
  const initials = application.seeker.fullName
    ? application.seeker.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "VA";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl border border-ink/8 bg-white p-3.5 text-left shadow-xs transition-all duration-200 hover:border-teal/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/30"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 font-display text-sm font-bold text-teal transition-transform group-hover:scale-105">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-display text-sm font-bold text-ink group-hover:text-teal">
            {application.seeker.fullName}
          </h4>
          <p className="mt-0.5 truncate text-xs text-ink/50">
            {application.seeker.headline || "Virtual Assistant"}
          </p>
        </div>
      </div>

      {application.seeker.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {application.seeker.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-ink/4 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink/60"
            >
              {skill}
            </span>
          ))}
          {application.seeker.skills.length > 3 && (
            <span className="rounded-md bg-ink/4 px-1.5 py-0.5 text-[9px] font-semibold text-ink/40">
              +{application.seeker.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-2.5">
        <span className="text-[10px] font-medium text-ink/40">{formatAppliedAt(application.appliedAt)}</span>
        {application.seeker.resumeUrl && (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-teal/8 px-1.5 py-0.5 text-[9px] font-semibold text-teal"
            title="Resume attached"
          >
            <Paperclip className="h-3 w-3" aria-hidden="true" />
            Resume
          </span>
        )}
      </div>
    </button>
  );
}
