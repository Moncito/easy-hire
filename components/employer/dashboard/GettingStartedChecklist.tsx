import Link from "next/link";
import { Check, Circle, ArrowRight } from "lucide-react";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";

type Props = {
  steps: GettingStartedStep[];
};

export default function GettingStartedChecklist({ steps }: Props) {
  const requiredSteps = steps.filter((step) => !step.optional);
  const pendingRequired = requiredSteps.filter((step) => !step.done);
  if (pendingRequired.length === 0) return null;

  const completedCount = requiredSteps.filter((step) => step.done).length;

  return (
    <div className="employer-ws-getting-started rounded-2xl border border-teal/15 p-5 shadow-sm ring-1 ring-teal/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal">Getting started</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
            Set up your hiring workspace
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            {completedCount} of {requiredSteps.length} complete — finish these steps to start
            receiving applicants.
          </p>
        </div>
        <div className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
          {completedCount}/{requiredSteps.length}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <div className="employer-ws-surface-muted flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ring-ink/[0.04]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={2.5} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink/45 line-through">{step.label}</p>
                </div>
              </div>
            ) : (
              <Link
                href={step.href}
                className={`employer-ws-surface group flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 transition hover:shadow-sm ${
                  step.optional
                    ? "ring-ink/[0.05] hover:ring-navy/20"
                    : "ring-ink/[0.06] hover:ring-teal/25"
                }`}
              >
                <Circle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${step.optional ? "text-navy/50" : "text-teal/70"}`}
                  strokeWidth={2}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold ${step.optional ? "text-ink/70 group-hover:text-navy" : "text-ink group-hover:text-teal"}`}
                  >
                    {step.label}
                    {step.optional && (
                      <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-ink/35">
                        Optional
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{step.description}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-teal" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
