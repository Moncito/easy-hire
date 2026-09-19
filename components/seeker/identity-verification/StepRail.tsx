import { CircleCheck } from "lucide-react";

type Props = {
  documentsCount: number;
};

function StepChip({ done, active, n }: { done: boolean; active: boolean; n: number }) {
  if (done) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marigold text-ink">
        <CircleCheck className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        active ? "bg-marigold text-ink" : "bg-ink/8 text-ink/40"
      }`}
    >
      {n}
    </span>
  );
}

function StepConnector({ filled }: { filled: boolean }) {
  return <div className={`h-px w-8 shrink-0 ${filled ? "bg-marigold/40" : "bg-ink/10"}`} aria-hidden="true" />;
}

export default function StepRail({ documentsCount }: Props) {
  const step1Done = documentsCount > 0;

  return (
    <ol className="flex flex-wrap items-center gap-3" aria-label="Verification steps">
      <li className="flex items-center gap-2.5" aria-current={!step1Done ? "step" : undefined}>
        <StepChip done={step1Done} active={!step1Done} n={1} />
        <div>
          <p className={`text-xs font-semibold ${step1Done ? "text-ink" : "text-ink/70"}`}>Upload documents</p>
          <p className="text-[11px] text-ink/40">
            {step1Done ? `${documentsCount} document${documentsCount === 1 ? "" : "s"}` : "Not uploaded"}
          </p>
        </div>
      </li>
      <StepConnector filled={step1Done} />
      <li className="flex items-center gap-2.5" aria-current={step1Done ? "step" : undefined}>
        <StepChip done={false} active={step1Done} n={2} />
        <div>
          <p className={`text-xs font-semibold ${step1Done ? "text-ink" : "text-ink/40"}`}>Review</p>
          <p className="text-[11px] text-ink/40">Not sent yet</p>
        </div>
      </li>
      <StepConnector filled={false} />
      <li className="flex items-center gap-2.5">
        <StepChip done={false} active={false} n={3} />
        <div>
          <p className="text-xs font-semibold text-ink/40">Verified</p>
          <p className="text-[11px] text-ink/40">Not yet</p>
        </div>
      </li>
    </ol>
  );
}
