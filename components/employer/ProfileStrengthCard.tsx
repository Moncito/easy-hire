"use client";

import { Check, Circle } from "lucide-react";

type ChecklistItem = {
  label: string;
  done: boolean;
};

type Props = {
  percentage: number;
  statusLabel: string;
  checklist: ChecklistItem[];
};

export default function ProfileStrengthCard({ percentage, statusLabel, checklist }: Props) {
  return (
    <div
      className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs transition-shadow duration-300 hover:shadow-sm"
      aria-labelledby="profile-strength-heading"
    >
      <div className="mb-1 flex items-center justify-between">
        <h3 id="profile-strength-heading" className="text-sm font-bold tracking-tight text-ink">
          Profile Strength
        </h3>
        <span className="rounded-full bg-teal/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
          {statusLabel}
        </span>
      </div>

      <div className="mb-5 mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-display text-3xl font-bold text-ink" aria-live="polite">
            {percentage}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40">
            Complete
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-ink/5"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Profile strength"
        >
          <div
            className="h-full rounded-full bg-teal transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2.5" aria-label="Profile completion checklist">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2.5 text-xs">
            {item.done ? (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal"
                aria-hidden="true"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/30"
                aria-hidden="true"
              >
                <Circle className="h-2 w-2 fill-current" />
              </span>
            )}
            <span className={item.done ? "font-medium text-ink/55" : "font-medium text-ink/80"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
