"use client";

import { useCallback, useState } from "react";
import { ExternalLink, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import SaveJobButton from "@/components/jobs/SaveJobButton";

type Props = {
  jobId: string;
  jobTitle: string;
  saved: boolean;
  onToggleSaved?: (jobId: string, nextSaved: boolean) => void;
};

function actionBtnClassName() {
  return "cursor-pointer rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink";
}

export default function JobListQuickActions({ jobId, jobTitle, saved, onToggleSaved }: Props) {
  const [copying, setCopying] = useState(false);
  const jobUrl =
    typeof window !== "undefined" ? `${window.location.origin}/jobs/${jobId}` : `/jobs/${jobId}`;

  const copyLink = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (copying) return;
      setCopying(true);
      try {
        await navigator.clipboard.writeText(jobUrl);
        toast.success("Job link copied");
      } catch {
        toast.error("Couldn't copy link");
      } finally {
        setCopying(false);
      }
    },
    [copying, jobUrl]
  );

  async function shareJob(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({ title: jobTitle, url: jobUrl });
      } catch {
        /* user cancelled */
      }
      return;
    }
    await copyLink(e);
  }

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <SaveJobButton
        jobId={jobId}
        saved={saved}
        onToggle={onToggleSaved}
        className="!p-1.5 opacity-100"
      />
      <button
        type="button"
        onClick={shareJob}
        className={actionBtnClassName()}
        aria-label="Share job"
        title="Share"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={copyLink}
        disabled={copying}
        className={actionBtnClassName()}
        aria-label="Copy job link"
        title="Copy link"
      >
        <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <a
        href={`/jobs/${jobId}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={actionBtnClassName()}
        aria-label="Open job in new tab"
        title="Open in new tab"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}
