import Link from "next/link";
import { Calendar, CalendarPlus, MapPin, Video } from "lucide-react";
import type { SeekerInterview } from "@/lib/seeker/dashboard";
import { interviewJoinUrl } from "@/lib/seeker/dashboard";
import { formatInterviewDuration, formatInterviewTimePHT, interviewFormatLabel } from "./interview-time";
import MessageEmployerButton from "@/components/seeker/MessageEmployerButton";

type Props = {
  interview: SeekerInterview | null;
  nowMs: number;
  seeAllHref?: string;
};

function companyInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SeekerNextInterviewCard({ interview, nowMs, seeAllHref = "#interviews-heading" }: Props) {
  if (!interview) {
    return (
      <div className="rounded-2xl bg-white p-5 ring-1 ring-ink/8">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-navy/50" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Next interview</p>
        </div>
        <p className="text-sm text-ink/50">No interviews scheduled yet — employers will reach out here.</p>
      </div>
    );
  }

  const cancelled = interview.status === "CANCELLED";
  const completed = interview.status === "COMPLETED";
  const isUpcoming = interview.scheduledAt.getTime() >= nowMs;
  const showCalendarLink = !cancelled && !completed;
  const joinUrl = interviewJoinUrl(interview.location);
  const awaitingResponse = !cancelled && !completed && isUpcoming && interview.seekerResponseStatus === null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-navy/12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "radial-gradient(circle at 100% 0%, rgba(30,58,95,0.10), transparent 60%)" }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-navy" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider text-navy/70">Next interview</p>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy font-display text-sm font-bold text-mist shadow-[0_3px_8px_rgba(30,58,95,0.3)]">
            {companyInitials(interview.companyName)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/jobs/${interview.jobId}`}
              className="block truncate font-display text-sm font-bold text-ink hover:text-navy"
            >
              {interview.jobTitle}
            </Link>
            <p className="truncate text-xs text-ink/50">{interview.companyName}</p>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-xs text-ink/55">
          <p className="inline-flex items-center gap-1.5 font-data">
            <time dateTime={interview.scheduledAt.toISOString()}>{formatInterviewTimePHT(interview.scheduledAt)}</time>
          </p>
          <p>
            {formatInterviewDuration(interview.durationMins)} · {interviewFormatLabel(interview.format)}
          </p>
          {!joinUrl && interview.location && (
            <p className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              {interview.location}
            </p>
          )}
        </div>

        {awaitingResponse && (
          <p className="mt-3 text-xs font-semibold text-[#8a5a10]">
            Awaiting your response —{" "}
            <a href={seeAllHref} className="underline underline-offset-2">
              respond below
            </a>
          </p>
        )}

        <div className="mt-4 space-y-2">
          {joinUrl && (
            <a
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-mist shadow-[0_4px_10px_rgba(30,58,95,0.3)] transition hover:bg-navy/90"
            >
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              Join interview
            </a>
          )}
          {showCalendarLink && (
            <a
              href={`/api/seeker/interviews/${interview.id}/ics`}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-xs font-semibold text-ink/60 transition hover:border-navy/30 hover:text-navy"
            >
              <CalendarPlus className="h-3.5 w-3.5" aria-hidden="true" />
              Add to calendar
            </a>
          )}
          <MessageEmployerButton jobId={interview.jobId} label="Message employer" />
        </div>

        <a
          href={seeAllHref}
          className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-navy/50 hover:text-navy"
        >
          See all interviews
        </a>
      </div>
    </div>
  );
}
