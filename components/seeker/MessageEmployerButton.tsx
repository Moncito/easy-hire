"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { fetchJsonSafe } from "@/lib/client/fetch-json";

type Props = {
  jobId: string;
  /**
   * Known already on the job detail page (the job's own company is loaded
   * server-side). Dashboard application rows don't carry a companyId in
   * their payload — see lib/seeker/dashboard.ts's `applications.job.company`
   * select, which only exposes `companyName` — so when this is omitted the
   * button resolves it itself via the existing public job-detail endpoint
   * right before posting, rather than guessing or leaving the action broken.
   */
  companyId?: string;
  compact?: boolean;
  label?: string;
};

type ConversationResponse = { id: string };
type PublicJobLookup = { company?: { id?: string } };

export default function MessageEmployerButton({
  jobId,
  companyId,
  compact = false,
  label = "Message employer",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorId = useId();

  async function resolveCompanyId(): Promise<string | null> {
    if (companyId) return companyId;
    try {
      const res = await fetch(`/api/public/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok) return null;
      const job = (await res.json()) as PublicJobLookup;
      return job.company?.id ?? null;
    } catch {
      return null;
    }
  }

  async function handleClick() {
    setLoading(true);
    setError("");

    const resolvedCompanyId = await resolveCompanyId();
    if (!resolvedCompanyId) {
      setError("Could not look up this employer. Please try again.");
      setLoading(false);
      return;
    }

    const result = await fetchJsonSafe<ConversationResponse>("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: resolvedCompanyId, jobId }),
    });

    if (!result.ok) {
      if (result.status === 403) {
        setError(result.error || "You can only message companies you've applied to.");
      } else if (result.status === 429) {
        setError("You're sending messages too fast — wait a moment and try again.");
      } else {
        setError(result.error || "Could not start the conversation. Please try again.");
      }
      setLoading(false);
      return;
    }

    router.push(`/seeker/messages?c=${result.data.id}`);
  }

  return (
    <div className={compact ? "inline-flex flex-col items-start" : "flex flex-col gap-1"}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        aria-busy={loading}
        aria-describedby={error ? errorId : undefined}
        className={
          compact
            ? "inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-ink/40 transition hover:text-teal disabled:cursor-not-allowed disabled:opacity-60"
            : "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-teal/30 py-2.5 text-sm font-semibold text-teal transition hover:bg-teal/8 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        <MessageSquare className={compact ? "h-3 w-3" : "h-4 w-4"} aria-hidden="true" />
        {loading ? "Starting…" : label}
      </button>

      {/* Screen-reader announcement of the async result, independent of the
          visible error paragraph below. */}
      <span aria-live="polite" className="sr-only">
        {loading ? "Starting conversation" : error}
      </span>

      {error && (
        <p id={errorId} className="text-xs font-medium text-ember">
          {error}
        </p>
      )}
    </div>
  );
}
