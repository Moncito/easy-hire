import { Calendar, Clock, MapPin, Video, XCircle } from "lucide-react";
import type { SeekerInterview } from "@/lib/seeker/dashboard";
import {
  formatInterviewDuration,
  formatInterviewTimePHT,
  interviewFormatLabel,
} from "./interview-time";

function InterviewRow({ interview }: { interview: SeekerInterview }) {
  const cancelled = interview.status === "CANCELLED";
  const completed = interview.status === "COMPLETED";
  const iso = interview.scheduledAt.toISOString();

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
                  <InterviewRow key={interview.id} interview={interview} />
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
                  <InterviewRow key={interview.id} interview={interview} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
