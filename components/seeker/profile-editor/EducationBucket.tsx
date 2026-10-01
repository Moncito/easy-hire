import { useState } from "react";
import { Plus, X } from "lucide-react";
import { displayEducation, formatEducation } from "@/lib/seeker/profile-format";
import { inputClassName, type UpdateField } from "./shared";

type Props = {
  education: string[];
  onChange: UpdateField;
};

export default function EducationBucket({ education, onChange }: Props) {
  const [eduDraft, setEduDraft] = useState({ school: "", degree: "", field: "", year: "" });

  function addEducation() {
    const school = eduDraft.school.trim();
    if (!school) return;
    const encoded = formatEducation({
      school,
      degree: eduDraft.degree.trim(),
      field: eduDraft.field.trim(),
      year: eduDraft.year.trim(),
    });
    onChange("education", [...education, encoded]);
    setEduDraft({ school: "", degree: "", field: "", year: "" });
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/55">School, degree, and year — optional but builds trust.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="eduDraftSchool" className="sr-only">
            School or university
          </label>
          <input
            id="eduDraftSchool"
            value={eduDraft.school}
            onChange={(e) => setEduDraft((d) => ({ ...d, school: e.target.value }))}
            placeholder="School / university"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="eduDraftDegree" className="sr-only">
            Degree
          </label>
          <input
            id="eduDraftDegree"
            value={eduDraft.degree}
            onChange={(e) => setEduDraft((d) => ({ ...d, degree: e.target.value }))}
            placeholder="Degree (e.g. BS IT)"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="eduDraftField" className="sr-only">
            Field of study
          </label>
          <input
            id="eduDraftField"
            value={eduDraft.field}
            onChange={(e) => setEduDraft((d) => ({ ...d, field: e.target.value }))}
            placeholder="Field of study (optional)"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="eduDraftYear" className="sr-only">
            Year graduated
          </label>
          <input
            id="eduDraftYear"
            value={eduDraft.year}
            onChange={(e) => setEduDraft((d) => ({ ...d, year: e.target.value }))}
            placeholder="Year graduated"
            className={inputClassName}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={addEducation}
        className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-mist hover:bg-navy/90"
      >
        <Plus className="h-4 w-4" />
        Add education
      </button>
      {education.length > 0 ? (
        <ul className="space-y-2">
          {education.map((entry) => (
            <li
              key={entry}
              className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist/60 px-3 py-2.5 text-sm text-ink"
            >
              <span>{displayEducation(entry)}</span>
              <button
                type="button"
                onClick={() => onChange("education", education.filter((x) => x !== entry))}
                className="cursor-pointer rounded-lg p-1 text-ink/35 hover:text-ember"
                aria-label="Remove education"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-ink/15 bg-mist/20 px-4 py-8 text-center text-sm text-ink/45">
          No education added yet.
        </p>
      )}
    </div>
  );
}
