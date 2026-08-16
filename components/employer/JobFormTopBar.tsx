"use client";

import InstantPublishNote from "@/components/employer/ui/InstantPublishNote";

type ChecklistItem = { label: string; done: boolean };

type EmploymentType = { value: string; label: string };

type Props = {
  title: string;
  category: string;
  location: string;
  remoteTypeLabel: string;
  employmentType: string;
  employmentTypes: EmploymentType[];
  onEmploymentTypeChange: (value: string) => void;
  targetHireCount: string;
  onTargetHireCountChange: (value: string) => void;
  checklist: ChecklistItem[];
  checklistDone: number;
};

export default function JobFormTopBar({
  title,
  category,
  location,
  remoteTypeLabel,
  employmentType,
  employmentTypes,
  onEmploymentTypeChange,
  targetHireCount,
  onTargetHireCountChange,
  checklist,
  checklistDone,
}: Props) {
  const employmentLabel =
    employmentTypes.find((t) => t.value === employmentType)?.label ?? "Full-Time";
  const previewMeta =
    [category, remoteTypeLabel, location].filter(Boolean).join(" · ") ||
    "Add role type and location";
  const progress = checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0;

  return (
    <div className="mb-5 rounded-2xl border border-navy/[0.08] bg-white/90 p-4 shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)] sm:p-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-5">
        <div className="rounded-xl bg-gradient-to-br from-navy/[0.05] to-teal/[0.04] p-3.5 ring-1 ring-navy/[0.06]">
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60">Live preview</p>
          <p className="mt-2 font-display text-base font-bold tracking-tight text-ink">
            {title.trim() || "Untitled role"}
          </p>
          <p className="mt-1 text-xs text-ink/55">{previewMeta}</p>
          <p className="mt-1 font-data text-[10px] text-ink/40">{employmentLabel}</p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">
              Employment type
            </p>
            <div className="flex flex-wrap gap-1.5">
              {employmentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onEmploymentTypeChange(type.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    employmentType === type.value
                      ? "border-ink bg-ink text-white"
                      : "border-ink/10 text-ink/75 hover:border-ink/30 hover:bg-ink/5"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="target-hire-count"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/40"
            >
              Target hires
            </label>
            <input
              id="target-hire-count"
              type="number"
              min={1}
              max={99}
              value={targetHireCount}
              onChange={(e) => onTargetHireCountChange(e.target.value)}
              className="w-full max-w-[8rem] rounded-xl border border-ink/10 px-3 py-2 font-data text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Checklist</p>
            <span className="font-data text-[10px] font-bold text-teal">
              {checklistDone}/{checklist.length}
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-teal transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-ink/60">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.done ? "bg-teal" : "bg-ink/15"
                  }`}
                  aria-hidden="true"
                />
                <span className={item.done ? "text-ink/75" : ""}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <InstantPublishNote />
    </div>
  );
}
