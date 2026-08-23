import Link from "next/link";
import { Check } from "lucide-react";
import { relativeTime } from "@/lib/time-ago";
import WithdrawApplicationButton from "@/components/seeker/WithdrawApplicationButton";

const STAGES = ["APPLIED", "SHORTLISTED", "INTERVIEW", "HIRED"] as const;
type Stage = (typeof STAGES)[number];

type AppForTimeline = {
  id: string;
  status: string;
  appliedAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    company: { companyName: string };
  };
};

type NodeState = "completed" | "current" | "future";

function getNodeState(stageIdx: number, currentIdx: number): NodeState {
  if (stageIdx < currentIdx) return "completed";
  if (stageIdx === currentIdx) return "current";
  return "future";
}

export default function ApplicationTimeline({ app }: { app: AppForTimeline }) {
  const rawIdx = STAGES.indexOf(app.status as Stage);
  const currentIdx = app.status === "HIRED" ? STAGES.length : rawIdx;

  return (
    <div>
      {/* App header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold text-ink">
            {app.job.company.companyName}
          </p>
          <Link
            href={`/jobs/${app.job.id}`}
            className="mt-0.5 block text-sm text-ink/50 transition-colors hover:text-navy"
          >
            {app.job.title}
          </Link>
        </div>
        <span className="shrink-0 text-xs text-ink/35">
          Updated {relativeTime(app.updatedAt.toISOString())}
        </span>
      </div>

      {/* Timeline */}
      <div
        className={`flex items-start ${app.status === "HIRED" ? "pb-4" : ""}`}
        role="list"
        aria-label="Application pipeline stages"
      >
        {STAGES.map((stage, i) => {
          const state = getNodeState(i, currentIdx);
          const isLast = i === STAGES.length - 1;

          // Line coloring: left line of node i is marigold if we've reached this stage (currentIdx >= i)
          const leftLineActive = currentIdx >= i;
          // Right line of node i is marigold if we've moved past this stage (currentIdx > i)
          const rightLineActive = currentIdx > i;

          const labelDate =
            stage === "APPLIED"
              ? relativeTime(app.appliedAt.toISOString())
              : state === "current"
              ? relativeTime(app.updatedAt.toISOString())
              : "";

          return (
            <div
              key={stage}
              role="listitem"
              aria-label={`${stage.charAt(0) + stage.slice(1).toLowerCase()}: ${state}`}
              className="flex flex-1 flex-col items-center"
            >
              {/* Stage label */}
              <span
                className={`mb-2.5 whitespace-nowrap text-center text-[10px] font-semibold uppercase tracking-wider ${
                  state === "future" ? "text-ink/25" : "text-ink/55"
                }`}
              >
                {stage.charAt(0) + stage.slice(1).toLowerCase()}
              </span>

              {/* Dot + connecting lines */}
              <div className="flex w-full items-center">
                {/* Left line */}
                {i > 0 && (
                  <div
                    aria-hidden="true"
                    className={`h-0.5 flex-1 transition-colors duration-500 ${
                      leftLineActive ? "bg-marigold" : "bg-ink/10"
                    }`}
                  />
                )}

                {/* Node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                      state === "completed"
                        ? "border-marigold bg-marigold"
                        : state === "current"
                        ? "border-marigold bg-white"
                        : "border-ink/15 bg-white"
                    }`}
                  >
                    {state === "completed" && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} aria-hidden="true" />
                    )}
                    {state === "current" && (
                      <span className="h-2 w-2 rounded-full bg-marigold" />
                    )}
                  </div>
                  {stage === "HIRED" && app.status === "HIRED" && (
                    <span className="absolute -bottom-5 rounded-full bg-marigold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7a4a0a]">
                      Hired
                    </span>
                  )}
                </div>

                {/* Right line */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className={`h-0.5 flex-1 transition-colors duration-500 ${
                      rightLineActive ? "bg-marigold" : "bg-ink/10"
                    }`}
                  />
                )}
              </div>

              {/* Date label */}
              <span className="mt-2 text-center text-[10px] leading-tight text-ink/35">
                {labelDate}
              </span>
            </div>
          );
        })}
      </div>

      {app.status === "APPLIED" ? (
        <WithdrawApplicationButton
          applicationId={app.id}
          jobId={app.job.id}
          jobTitle={app.job.title}
        />
      ) : null}
    </div>
  );
}
