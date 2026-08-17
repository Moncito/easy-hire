"use client";

import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { primaryFromResumes } from "@/lib/seeker-profile-format";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import type { CandidateApplication } from "./types";

function resumeMeta(seeker: CandidateApplication["seeker"]) {
  if (!seeker.resumeUrl) return null;
  const primary = primaryFromResumes(seeker.resumes ?? [], seeker.resumeUrl);
  const name = seeker.resumeLabel || primary?.label || "Resume";
  const ext = seeker.resumeUrl.split(".").pop()?.toUpperCase() || "PDF";
  const updated = seeker.resumeUpdatedAt
    ? new Date(seeker.resumeUpdatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return { name, ext, updated };
}

type Props = {
  application: CandidateApplication;
};

export default function CandidateApplicationTab({ application }: Props) {
  const { isPro } = useEmployerShell();
  const [expanded, setExpanded] = useState(false);
  const resume = resumeMeta(application.seeker);
  const cover = application.coverNote?.trim();
  const isLong = (cover?.length ?? 0) > 280;
  const resumeHref = `/api/employer/talent/${application.seeker.id}/resume`;

  const resumeRow = resume ? (
    <div className={`flex items-center gap-3 ${isPro ? "border-b border-ink/8 pb-3" : "rounded-[20px] bg-white p-3 shadow-sm ring-1 ring-ink/5"}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isPro ? "bg-navy/8 text-navy" : "bg-teal/8 text-teal"
        }`}
      >
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{resume.name}</p>
        <p className="text-xs text-ink/40">
          {resume.ext}
          {resume.updated ? ` · ${resume.updated}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-0.5">
        <a
          href={resumeHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-lg p-2 text-ink/40 transition hover:bg-ink/5 ${isPro ? "hover:text-ink" : "hover:text-teal"}`}
          title="Preview"
        >
          <Eye className="h-4 w-4" />
        </a>
        <a
          href={resumeHref}
          className={`rounded-lg p-2 text-ink/40 transition hover:bg-ink/5 ${isPro ? "hover:text-ink" : "hover:text-teal"}`}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    </div>
  ) : null;

  const coverBlock = (
    <div className={isPro ? "" : "rounded-[20px] border border-ink/6 bg-white p-4 shadow-sm"}>
      <h3 className="font-display text-sm font-semibold text-ink">Cover letter</h3>
      {cover ? (
        <>
          <p
            className={`mt-2 text-sm leading-relaxed text-ink/75 ${isPro ? "border-l-2 border-marigold/50 pl-3" : ""} ${
              !expanded && isLong ? "line-clamp-5" : ""
            }`}
          >
            {cover}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={`mt-2 text-xs font-semibold hover:underline ${isPro ? "text-[#9A5B12]" : "text-teal"}`}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm text-ink/35">No cover letter provided.</p>
      )}
    </div>
  );

  const answers = application.answers && application.answers.length > 0 && (
    <div className={isPro ? "" : "rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-ink/5"}>
      <h3 className="font-display text-sm font-semibold text-ink">
        Screening answers
        <span className="ml-1.5 font-data text-xs font-normal text-ink/35">
          {application.answers.length}
        </span>
      </h3>
      <div className="mt-3 space-y-3">
        {application.answers.map((a) => (
          <div
            key={a.id}
            className={`pl-3 ${isPro ? "border-l-2 border-navy/30" : "border-l-2 border-teal/30"}`}
          >
            <p className="text-xs font-medium text-ink/50">{a.question.prompt}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/80">{a.answerText}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={isPro ? "space-y-5" : "space-y-4"}>
      {resumeRow}
      {coverBlock}
      {answers}
    </div>
  );
}
