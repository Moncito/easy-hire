import { useState } from "react";
import { Plus, X } from "lucide-react";
import { displayWorkExperience, formatWorkExperience, parseWorkExperience } from "@/lib/seeker/profile-format";
import { inputClassName, type UpdateField } from "./shared";

type Props = {
  workExperience: string[];
  onChange: UpdateField;
};

export default function CareerBucket({ workExperience, onChange }: Props) {
  const [workDraft, setWorkDraft] = useState({
    title: "",
    company: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  function addWorkExperience() {
    const title = workDraft.title.trim();
    const company = workDraft.company.trim();
    if (!title || !company) return;
    const encoded = formatWorkExperience({
      title,
      company,
      startDate: workDraft.startDate.trim(),
      endDate: workDraft.endDate.trim(),
      description: workDraft.description.trim(),
    });
    onChange("workExperience", [...workExperience, encoded]);
    setWorkDraft({ title: "", company: "", startDate: "", endDate: "", description: "" });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/55">
        Add roles in reverse chronological order — most recent first.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="workDraftTitle" className="sr-only">
            Job title
          </label>
          <input
            id="workDraftTitle"
            value={workDraft.title}
            onChange={(e) => setWorkDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Job title"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="workDraftCompany" className="sr-only">
            Company or client
          </label>
          <input
            id="workDraftCompany"
            value={workDraft.company}
            onChange={(e) => setWorkDraft((d) => ({ ...d, company: e.target.value }))}
            placeholder="Company / client"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="workDraftStartDate" className="sr-only">
            Start date
          </label>
          <input
            id="workDraftStartDate"
            value={workDraft.startDate}
            onChange={(e) => setWorkDraft((d) => ({ ...d, startDate: e.target.value }))}
            placeholder="Start (e.g. Jan 2022)"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="workDraftEndDate" className="sr-only">
            End date
          </label>
          <input
            id="workDraftEndDate"
            value={workDraft.endDate}
            onChange={(e) => setWorkDraft((d) => ({ ...d, endDate: e.target.value }))}
            placeholder="End (e.g. Present)"
            className={inputClassName}
          />
        </div>
      </div>
      <div>
        <label htmlFor="workDraftDescription" className="sr-only">
          Role description
        </label>
        <textarea
          id="workDraftDescription"
          value={workDraft.description}
          onChange={(e) => setWorkDraft((d) => ({ ...d, description: e.target.value }))}
          rows={3}
          placeholder="What you did — tools, outcomes, team size…"
          className={`${inputClassName} resize-y`}
        />
      </div>
      <button
        type="button"
        onClick={addWorkExperience}
        className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
      >
        <Plus className="h-4 w-4" />
        Add role
      </button>
      {workExperience.length > 0 ? (
        <ul className="space-y-3">
          {workExperience.map((entry) => {
            const parsed = parseWorkExperience(entry);
            return (
              <li
                key={entry}
                className="rounded-xl border border-ink/8 bg-mist/60 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{displayWorkExperience(entry)}</p>
                    {parsed.description && (
                      <p className="mt-1 text-xs leading-relaxed text-ink/55">{parsed.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange("workExperience", workExperience.filter((x) => x !== entry))}
                    className="cursor-pointer rounded-lg p-1 text-ink/35 hover:bg-ink/5 hover:text-ember"
                    aria-label="Remove role"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-ink/15 bg-mist/20 px-4 py-8 text-center text-sm text-ink/45">
          No roles added yet — even freelance VA work counts.
        </p>
      )}
    </div>
  );
}
