import Link from "next/link";
import { Check, Circle, ArrowRight } from "lucide-react";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";

type Props = {
  steps: GettingStartedStep[];
};

export default function ProGettingStarted({ steps }: Props) {
  const requiredSteps = steps.filter((step) => !step.optional);
  const pendingRequired = requiredSteps.filter((step) => !step.done);
  if (pendingRequired.length === 0) return null;

  const completedCount = requiredSteps.filter((step) => step.done).length;

  return (
    <div className="pro-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Getting started</p>
          <h2 className="mt-1 font-display text-lg font-black tracking-tighter text-ink">
            Set up your hiring workspace
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/55">
            {completedCount} of {requiredSteps.length} complete — finish these to start receiving applicants.
          </p>
        </div>
        <div className="rounded-full bg-ink px-3 py-1 font-data text-xs font-semibold text-white">
          {completedCount}/{requiredSteps.length}
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <div className="flex items-start gap-3 rounded-xl bg-ink/[0.03] px-3 py-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" strokeWidth={2.5} />
                <p className="text-sm font-semibold text-ink/45 line-through">{step.label}</p>
              </div>
            ) : (
              <Link
                href={step.href}
                className="group flex items-start gap-3 rounded-xl px-3 py-2.5 ring-1 ring-ink/[0.06] transition hover:bg-ink/[0.02] hover:ring-ink/15"
              >
                <Circle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${step.optional ? "text-ink/35" : "text-[#9A5B12]"}`}
                  strokeWidth={2}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink group-hover:text-[#9A5B12]">
                    {step.label}
                    {step.optional && (
                      <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-ink/35">
                        Optional
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/50">{step.description}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-[#9A5B12]" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
