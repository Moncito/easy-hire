"use client";

import { useState } from "react";
import { ArrowRightLeft, CheckCircle2, LoaderCircle, MessagesSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { relativeTime } from "@/lib/shared/time-ago";

type Activity = {
  id: string;
  type: "NOTE" | "STAGE_CHANGE";
  body: string | null;
  createdAt: string;
  actorMember: { user: { email: string } } | null;
};

type Props = {
  companyId: string;
  jobId: string;
  applicationId: string;
  appliedAt: string;
  initialActivities: Activity[];
  canAddActivity: boolean;
};

function titleCaseWord(word: string) {
  const lower = word.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleCasePhrase(phrase: string) {
  return phrase
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

function formatStageChange(body: string | null) {
  if (!body) return "Moved to a new stage";
  const [from, to] = body.split("→").map((part) => part.trim());
  if (!from || !to) return body;
  return `Moved from ${titleCasePhrase(from)} to ${titleCasePhrase(to)}`;
}

export default function ApplicationActivityFeed({ companyId, jobId, applicationId, appliedAt, initialActivities, canAddActivity }: Props) {
  const [activities, setActivities] = useState(initialActivities);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function postNote() {
    const body = note.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Could not post note.");
      setActivities((current) => [...current, result]);
      setNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not post note.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_10px_30px_rgba(32,36,43,0.04)]">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal/10 text-teal">
          <MessagesSquare className="h-4 w-4" />
        </span>
        <h2 className="font-display text-xl font-bold text-ink">Activity</h2>
      </div>

      <ol className="mt-4 space-y-3">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal/10 text-teal">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink/70">Application received</p>
            <p className="text-xs text-ink/40" title={new Date(appliedAt).toLocaleString()}>{relativeTime(appliedAt)}</p>
          </div>
        </li>
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-start gap-3">
            {activity.type === "STAGE_CHANGE" ? (
              <>
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-ink/45">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm italic text-ink/50">
                    {formatStageChange(activity.body)}
                    {activity.actorMember && <span className="not-italic text-ink/35"> · {activity.actorMember.user.email}</span>}
                  </p>
                  <p className="text-xs text-ink/35" title={new Date(activity.createdAt).toLocaleString()}>{relativeTime(activity.createdAt)}</p>
                </div>
              </>
            ) : (
              <>
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-marigold/20 text-[#9A5B12]">
                  <MessagesSquare className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{activity.body}</p>
                  <p className="mt-0.5 text-xs text-ink/40">
                    {activity.actorMember?.user.email ?? "Teammate"} · <span title={new Date(activity.createdAt).toLocaleString()}>{relativeTime(activity.createdAt)}</span>
                  </p>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>

      {canAddActivity && (
        <div className="mt-5 border-t border-ink/[0.07] pt-4">
          <label htmlFor="activity-note" className="text-sm font-semibold text-ink">Add a note</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
            <textarea
              id="activity-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              rows={2}
              disabled={submitting}
              placeholder="Share context with your hiring team…"
              className="w-full flex-1 resize-y rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm leading-6 text-ink outline-none transition focus:border-teal focus:ring-3 focus:ring-teal/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void postNote()}
              disabled={!note.trim() || submitting}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
