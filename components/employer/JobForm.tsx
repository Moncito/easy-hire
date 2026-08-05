"use client";

import { useState } from "react";
import { HelpCircle, MapPin, Plus, Trash2 } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import EmployerActionBar from "@/components/employer/EmployerActionBar";
import EmployerFormSection from "@/components/employer/ui/EmployerFormSection";
import { INDUSTRIES, ROLE_TYPES } from "@/lib/constants/job-categories";
import { periodSuffix, type SalaryPeriod } from "@/lib/format";

const employmentTypes = [
  { value: "FULL_TIME", label: "Full-Time" },
  { value: "PART_TIME", label: "Part-Time" },
  { value: "CONTRACT", label: "Contract" },
];
const remoteTypes = [
  { value: "REMOTE", label: "Remote" },
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
];
const salaryPeriods: { value: SalaryPeriod; label: string }[] = [
  { value: "HOURLY", label: "Hourly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
];

const MAX_SCREENING_QUESTIONS = 5;

export type ScreeningQuestionFormItem = {
  prompt: string;
  required: boolean;
};

export type JobFormData = {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  category: string;
  industry: string;
  employmentType: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: string;
  location: string;
  remoteType: string;
  screeningQuestions: ScreeningQuestionFormItem[];
};

export type JobSubmitIntent = "draft" | "submit";

type Props = {
  initialData?: Partial<JobFormData>;
  loading: boolean;
  onSubmit: (data: JobFormData, intent: JobSubmitIntent) => void;
};

export default function JobForm({ initialData, loading, onSubmit }: Props) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requirements, setRequirements] = useState(initialData?.requirements || "");
  const [benefits, setBenefits] = useState(initialData?.benefits || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [industry, setIndustry] = useState(initialData?.industry || "");
  const [employmentType, setEmploymentType] = useState(initialData?.employmentType || "FULL_TIME");
  const [salaryMin, setSalaryMin] = useState(initialData?.salaryMin || "");
  const [salaryMax, setSalaryMax] = useState(initialData?.salaryMax || "");
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>(
    (initialData?.salaryPeriod as SalaryPeriod) || "MONTHLY"
  );
  const [location, setLocation] = useState(initialData?.location || "");
  const [remoteType, setRemoteType] = useState(initialData?.remoteType || "REMOTE");
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestionFormItem[]>(
    initialData?.screeningQuestions ?? []
  );
  const [error, setError] = useState("");

  function buildPayload(): JobFormData {
    return {
      title,
      description,
      requirements,
      benefits,
      category,
      industry,
      employmentType,
      salaryMin,
      salaryMax,
      salaryPeriod,
      location,
      remoteType,
      screeningQuestions: screeningQuestions
        .map((q) => ({ prompt: q.prompt.trim(), required: q.required }))
        .filter((q) => q.prompt.length > 0),
    };
  }

  function validate(): boolean {
    setError("");
    if (!title || !description || !category || !location) {
      setError("Job title, description, category, and location are required.");
      return false;
    }
    if (screeningQuestions.some((q) => q.prompt.trim().length > 300)) {
      setError("Each screening question must be under 300 characters.");
      return false;
    }
    return true;
  }

  function addScreeningQuestion() {
    if (screeningQuestions.length >= MAX_SCREENING_QUESTIONS) return;
    setScreeningQuestions((prev) => [...prev, { prompt: "", required: true }]);
  }

  function updateScreeningQuestion(index: number, patch: Partial<ScreeningQuestionFormItem>) {
    setScreeningQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  function removeScreeningQuestion(index: number) {
    setScreeningQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAction(intent: JobSubmitIntent) {
    if (!validate()) return;
    onSubmit(buildPayload(), intent);
  }

  const chipClass = (selected: boolean) =>
    `rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
      selected
        ? "border-teal bg-teal text-white shadow-xs"
        : "border-ink/10 text-ink/75 hover:border-teal/30 hover:bg-teal/5"
    }`;

  const checklist = [
    { label: "Job title", done: !!title.trim() },
    { label: "Description", done: !!description.trim() },
    { label: "Role type", done: !!category },
    { label: "Location", done: !!location.trim() },
  ];
  const checklistDone = checklist.filter((item) => item.done).length;

  return (
    <div className="pb-24">
      {error && (
        <div className="mb-5 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <EmployerFormSection
            title="Job Information"
            description="Start with the role title and how you categorize this position."
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What role are you hiring for?"
              className="w-full border-none bg-transparent py-1 font-display text-2xl font-bold tracking-tight text-ink outline-none placeholder:text-ink/30"
            />
            <div className="mt-4 h-px bg-ink/10" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Role type
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-teal"
                >
                  <option value="">Select a role type</option>
                  {ROLE_TYPES.map((rt) => (
                    <option key={rt.slug} value={rt.label}>
                      {rt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-ink/40">The specific VA function you&apos;re hiring for.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/40">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-teal"
                >
                  <option value="">Select an industry (optional)</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.slug} value={ind.label}>
                      {ind.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-ink/40">The business domain this role supports.</p>
              </div>
            </div>
          </EmployerFormSection>

          <EmployerFormSection
            title="Description"
            description="Describe responsibilities, day-to-day work, and what success looks like in this role."
          >
            <RichTextEditor
              value={description}
              onChange={setDescription}
              minHeight="280px"
              placeholder="Describe the role responsibilities, team context, and day-to-day work..."
            />
          </EmployerFormSection>

          <EmployerFormSection
            title="Requirements"
            description="List required skills, tools, experience level, and language expectations."
          >
            <RichTextEditor
              value={requirements}
              onChange={setRequirements}
              minHeight="200px"
              placeholder="e.g. 2+ years VA experience, fluent English, HubSpot..."
            />
          </EmployerFormSection>

          <EmployerFormSection
            title="Benefits"
            description="Highlight perks candidates care about — training, equipment, flexible hours, or growth opportunities."
          >
            <RichTextEditor
              value={benefits}
              onChange={setBenefits}
              minHeight="200px"
              placeholder="e.g. Paid training, equipment provided, flexible schedule..."
            />
          </EmployerFormSection>

          <EmployerFormSection
            title="Compensation"
            description="Set an expected salary range in Philippine Peso (PHP) and how it's paid out."
          >
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">Pay period</p>
              <div className="flex flex-wrap gap-1.5">
                {salaryPeriods.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setSalaryPeriod(p.value)}
                    className={chipClass(salaryPeriod === p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink/45">
                  Minimum (PHP{periodSuffix(salaryPeriod)})
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="20000"
                  className="w-full rounded-xl border border-ink/10 px-3 py-2.5 font-data text-sm text-ink outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-ink/45">
                  Maximum (PHP{periodSuffix(salaryPeriod)})
                </label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="35000"
                  className="w-full rounded-xl border border-ink/10 px-3 py-2.5 font-data text-sm text-ink outline-none focus:border-teal"
                />
              </div>
            </div>
          </EmployerFormSection>

          <EmployerFormSection
            title="Location"
            description="Where will this virtual assistant be working from?"
          >
            <div className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-ink/35" aria-hidden="true" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Philippines (Remote)"
                  className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-teal"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">Work Setup</p>
                <div className="flex flex-wrap gap-1.5">
                  {remoteTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setRemoteType(type.value)}
                      className={chipClass(remoteType === type.value)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </EmployerFormSection>

          <EmployerFormSection
            title="Screening questions"
            description="Optional short-text questions applicants answer when they apply. Answers are for your review only — nothing auto-rejects."
            last
          >
            <div className="space-y-3">
              {screeningQuestions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-xl bg-ink/[0.02] p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-ink/45">
                      Question {index + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeScreeningQuestion(index)}
                      className="rounded-lg p-1.5 text-ink/35 transition hover:bg-ember/5 hover:text-ember"
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <textarea
                    value={question.prompt}
                    onChange={(e) => updateScreeningQuestion(index, { prompt: e.target.value })}
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. What timezone do you work in?"
                    className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-ink/60">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateScreeningQuestion(index, { required: e.target.checked })
                        }
                        className="rounded border-ink/20 text-teal focus:ring-teal"
                      />
                      Required
                    </label>
                    <span className="font-data text-[10px] text-ink/35">
                      {question.prompt.length}/300
                    </span>
                  </div>
                </div>
              ))}

              {screeningQuestions.length < MAX_SCREENING_QUESTIONS ? (
                <button
                  type="button"
                  onClick={addScreeningQuestion}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/15 px-3 py-2.5 text-xs font-semibold text-ink/60 transition hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add question ({screeningQuestions.length}/{MAX_SCREENING_QUESTIONS})
                </button>
              ) : (
                <p className="text-center text-[11px] text-ink/40">
                  Maximum of {MAX_SCREENING_QUESTIONS} questions reached.
                </p>
              )}
            </div>
          </EmployerFormSection>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-2xl bg-white/80 p-5 backdrop-blur-sm">
            <div>
              <h3 className="text-sm font-bold text-ink">Job settings</h3>
              <p className="mt-1 text-xs text-ink/45">Employment type and submission checklist.</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40">Employment type</p>
              <div className="flex flex-wrap gap-1.5">
                {employmentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEmploymentType(type.value)}
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
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Checklist</p>
                <span className="font-data text-[10px] font-bold text-teal">
                  {checklistDone}/{checklist.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-xs text-ink/60">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        item.done ? "bg-teal" : "bg-ink/15"
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-ink/5 pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink/40">Preview</p>
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-ink">
                  {title.trim() || "Untitled role"}
                </p>
                <p className="text-xs text-ink/50">
                  {[category, remoteTypes.find((t) => t.value === remoteType)?.label, location]
                    .filter(Boolean)
                    .join(" · ") || "Add role type and location"}
                </p>
                <p className="font-data text-[10px] text-ink/40">
                  {employmentTypes.find((t) => t.value === employmentType)?.label}
                </p>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-ink/45">
              Submit for review when ready. Our team approves jobs before they appear to seekers.
            </p>
          </div>
        </div>
      </div>

      <EmployerActionBar align="6xl">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-1.5 text-xs text-ink/40">
            <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Jobs are reviewed before going live
          </span>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("draft")}
              className="rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("submit")}
              className="rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-all hover:bg-teal/95 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit for review"}
            </button>
          </div>
        </div>
      </EmployerActionBar>
    </div>
  );
}
