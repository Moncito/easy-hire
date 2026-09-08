"use client";

import { useState } from "react";
import { Calendar, CalendarPlus, Check, Clock, MapPin, Video, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { SeekerInterview } from "@/lib/seeker/dashboard";
import {
  formatInterviewDuration,
  formatInterviewTimePHT,
  interviewFormatLabel,
} from "./interview-time";

function InterviewRow({ interview, nowMs }: { interview: SeekerInterview; nowMs: number }) {
  const [responseStatus, setResponseStatus] = useState(interview.seekerResponseStatus);
  const [submitting, setSubmitting] = useState(false);

  const cancelled = interview.status === "CANCELLED";
  const completed = interview.status === "COMPLETED";
  const isUpcoming = interview.scheduledAt.getTime() >= nowMs;
  const iso = interview.scheduledAt.toISOString();

  // .ics downloads are only ever refused for CANCELLED interviews
  // (getInterviewIcsForSeeker), but we also hide the link for COMPLETED
  // ones here — no value in downloading a calendar entry for an interview
  // that already happened.
  const showCalendarLink = !cancelled && !completed;
  const canRespond = !cancelled && !completed && isUpcoming && responseStatus === null;
  const showStatusBadge = !cancelled && !completed && responseStatus !== null;

  async function respond(response: "ACCEPTED" | "DECLINED") {
    setSubmitting(true);
    const prev = responseStatus;
    setResponseStatus(response);
    try {
      const res = await fetch(`/api/seeker/interviews/${interview.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setResponseStatus(prev);
      toast.error("Couldn't record your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <li className="flex items-start gap-3 py-3.5 first:pt-4 last:pb-4">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          cancelled ? "bg-ember/10 text-ember" : "bg-teal/10 text-teal"
        }`}
        aria-hidden="true"
      >
        {cancelled ? <XCircle className="h-4 w-4" /> : <Video className="h-4 w-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-medium ${cancelled ? "text-ink/40 line-through" : "text-ink"}`}>
            {interview.jobTitle}
          </p>
          {cancelled && (
            <span className="rounded-lg bg-ember/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ember">
              Cancelled
            </span>
          )}
          {completed && (
            <span className="rounded-lg bg-ink/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/45">
              Completed
            </span>
          )}
        </div>
        <p className="text-xs text-ink/45">{interview.companyName}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55">
          <span className="inline-flex items-center gap-1 font-data">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <time dateTime={iso}>{formatInterviewTimePHT(interview.scheduledAt)}</time>
          </span>
          <span className="font-data">{formatInterviewDuration(interview.durationMins)}</span>
          <span>{interviewFormatLabel(interview.format)}</span>
          {interview.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {interview.location}
            </span>
          )}
        </div>

        {(canRespond || showStatusBadge || showCalendarLink) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {canRespond && (
              <>
                <button
                  type="button"
                  onClick={() => respond("ACCEPTED")}
                  disabled={submitting}
                  aria-label={`Accept interview for ${interview.jobTitle} at ${interview.companyName}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => respond("DECLINED")}
                  disabled={submitting}
                  aria-label={`Decline interview for ${interview.jobTitle} at ${interview.companyName}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/60 transition hover:border-ink/30 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Decline
                </button>
              </>
            )}

            {showStatusBadge && (
              <span
                className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  responseStatus === "ACCEPTED"
                    ? "bg-teal/10 text-teal"
                    : "bg-ink/5 text-ink/45"
                }`}
              >
                {responseStatus === "ACCEPTED" ? "Accepted" : "Declined"}
              </span>
            )}

            {showCalendarLink && (
              <a
                href={`/api/seeker/interviews/${interview.id}/ics`}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3 py-1.5 text-xs font-semibold text-ink/55 transition hover:border-navy/25 hover:text-navy"
              >
                <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Add to calendar
              </a>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export default function SeekerInterviewsSection({
  interviews,
  nowMs,
}: {
  interviews: SeekerInterview[];
  nowMs: number;
}) {
  const upcoming = [...interviews]
    .filter((i) => i.scheduledAt.getTime() >= nowMs)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  const past = [...interviews]
    .filter((i) => i.scheduledAt.getTime() < nowMs)
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());

  return (
    <section aria-labelledby="interviews-heading">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4 w-4 text-navy/50" aria-hidden="true" />
        <h2 id="interviews-heading" className="font-display text-lg font-bold text-ink">
          Interviews
        </h2>
      </div>

      {interviews.length === 0 ? (
        <div className="rounded-2xl bg-ink/[0.02] px-6 py-10 text-center ring-1 ring-ink/6">
          <p className="text-sm text-ink/50">
            No interviews scheduled yet. Employers will reach out here once they&apos;d like to
            talk.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white px-5 ring-1 ring-ink/8">
          {upcoming.length > 0 && (
            <div>
              <h3 className="pt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
                Upcoming
              </h3>
              <ul className="divide-y divide-ink/5" aria-label="Upcoming interviews">
                {upcoming.map((interview) => (
                  <InterviewRow key={interview.id} interview={interview} nowMs={nowMs} />
                ))}
              </ul>
            </div>
          )}

          {past.length > 0 && (
            <div className={upcoming.length > 0 ? "border-t border-ink/5" : ""}>
              <h3 className="pt-4 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
                Past
              </h3>
              <ul className="divide-y divide-ink/5" aria-label="Past interviews">
                {past.map((interview) => (
                  <InterviewRow key={interview.id} interview={interview} nowMs={nowMs} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
