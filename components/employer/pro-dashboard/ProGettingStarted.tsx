import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { Card, CardHeader, StatusBadge } from "@/components/employer/system";
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
    <Card aria-labelledby="pro-getting-started-heading" tone="attention">
      <CardHeader
        id="pro-getting-started-heading"
        title="Set up your hiring workspace"
        action={
          <StatusBadge tone="warning" className="num">
            {completedCount} of {requiredSteps.length} done
          </StatusBadge>
        }
      />
      <p className="mt-1 text-ui text-eh-muted">Finish these to start receiving applicants.</p>

      <ul className="mt-4 flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.id}>
            {step.done ? (
              <div className="flex items-start gap-3 rounded-control bg-eh-surface-2 px-3 py-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-eh-success" strokeWidth={2.5} aria-hidden="true" />
                <p className="text-ui font-medium text-eh-muted line-through">{step.label}</p>
              </div>
            ) : (
              <Link
                href={step.href}
                className="group flex items-start gap-3 rounded-control border border-eh-line px-3 py-2.5 transition-colors duration-150 hover:bg-eh-surface-2"
              >
                <Circle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${step.optional ? "text-eh-muted" : "text-eh-marigold-ink"}`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-semibold text-eh-ink">
                    {step.label}
                    {step.optional && <span className="ml-1.5 text-micro font-medium text-eh-muted">Optional</span>}
                  </p>
                  <p className="mt-0.5 text-small text-eh-muted">{step.description}</p>
                </div>
                <ArrowRight
                  className="mt-0.5 h-4 w-4 shrink-0 text-eh-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-eh-ink"
                  aria-hidden="true"
                />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
