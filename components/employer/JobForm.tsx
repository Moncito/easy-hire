"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Banknote,
  Briefcase,
  FileText,
  Gift,
  HelpCircle,
  ListChecks,
  MapPin,
  MessageSquareText,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import RichTextEditor from "@/components/ui/RichTextEditor";
import EmployerActionBar from "@/components/employer/EmployerActionBar";
import JobFormTopBar from "@/components/employer/JobFormTopBar";
import EasyAiJobCopyPanel from "@/components/employer/EasyAiJobCopyPanel";
import EasyAiScreeningPanel from "@/components/employer/EasyAiScreeningPanel";
import PostingComplianceNotice from "@/components/employer/PostingComplianceNotice";
import { checkPostingCompliance } from "@/lib/jobs/posting-compliance";
import JobSoftCapBanner from "@/components/employer/ui/JobSoftCapBanner";
import EmployerFormSection from "@/components/employer/ui/EmployerFormSection";
import EmployerFormSelect from "@/components/employer/ui/EmployerFormSelect";
import ProFormSection from "@/components/employer/pro-dashboard/ProFormSection";
import { AttentionBanner, Button, IconButton, Select, StatusBadge } from "@/components/employer/system";
import type { SectionTone } from "@/components/employer/talent/tones";
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
  targetHireCount: string;
  screeningQuestions: ScreeningQuestionFormItem[];
};

export type JobSubmitIntent = "draft" | "submit";

type Props = {
  initialData?: Partial<JobFormData>;
  loading: boolean;
  onSubmit: (data: JobFormData, intent: JobSubmitIntent) => void;
  /** Hides the owner-only Easy AI panels (job copy + screening question generation).
   * Both call an owner-scoped AI endpoint that isn't membership-aware yet, so
   * collaborator sessions (e.g. the collaborative hiring workspace) must suppress
   * them even when rendering the Pro visual branch. Defaults to false/undefined
   * so app/employer/jobs/new and the owner's edit flow are unaffected. */
  hideAiTools?: boolean;
  /** Verified Employer Pro: "submit" publishes live (canAutoPublishJob), so say so. */
  canPublishInstantly?: boolean;
  /**
   * Editing a job that is already live. The submit endpoint only accepts
   * drafts and pending jobs, and "Save draft" wouldn't make it a draft, so
   * a live job gets one honest action: save the changes (the PATCH alone —
   * the server keeps it live or sends it back to review per plan).
   */
  editingLiveJob?: boolean;
};

/** Pro: a card per section with a tinted icon chip. Free: the original divided section. */
function Section({
  pro,
  title,
  description,
  icon,
  tone,
  last,
  children,
}: {
  pro: boolean;
  title: string;
  description?: string;
  icon: ReactNode;
  tone: SectionTone;
  last?: boolean;
  children: ReactNode;
}) {
  if (pro) {
    return (
      <ProFormSection title={title} description={description} icon={icon} tone={tone}>
        {children}
      </ProFormSection>
    );
  }
  return (
    <EmployerFormSection title={title} description={description} last={last}>
      {children}
    </EmployerFormSection>
  );
}

const PRO_LABEL = "mb-1.5 block text-small font-medium text-eh-ink-2";
const PRO_INPUT =
  "h-10 w-full rounded-control border border-eh-line bg-eh-surface px-3 text-ui text-eh-ink outline-none transition-colors duration-150 placeholder:text-eh-muted hover:border-[color-mix(in_srgb,var(--eh-ink)_22%,var(--eh-line))] focus-visible:border-eh-teal";

export default function JobForm({
  initialData,
  loading,
  onSubmit,
  hideAiTools = false,
  canPublishInstantly = false,
  editingLiveJob = false,
}: Props) {
  const { isPro } = useEmployerShell();
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
  const [targetHireCount, setTargetHireCount] = useState(initialData?.targetHireCount || "1");
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
      targetHireCount,
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
    const hires = Number(targetHireCount);
    if (!Number.isFinite(hires) || hires < 1 || hires > 99) {
      setError("Target hires must be between 1 and 99.");
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
    isPro
      ? `inline-flex h-8 items-center rounded-full border px-3 text-ui transition-colors duration-150 ${
          selected
            ? "border-eh-ink bg-eh-ink font-medium text-eh-surface"
            : "border-eh-line bg-eh-surface text-eh-ink-2 hover:border-eh-muted hover:text-eh-ink"
        }`
      : `cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
      selected
        ? isPro
          ? "border-ink bg-ink text-mist shadow-xs"
          : "border-teal bg-teal text-white shadow-xs"
        : isPro
          ? "border-ink/10 text-ink/75 hover:border-ink/25 hover:bg-ink/5"
          : "border-ink/10 text-ink/75 hover:border-teal/30 hover:bg-teal/5"
    }`;

  const fieldFocus = isPro
    ? "focus:border-ink/25"
    : "focus:border-teal";

  const salaryPlaceholders =
    salaryPeriod === "HOURLY"
      ? { min: "8", max: "15" }
      : salaryPeriod === "ANNUAL"
        ? { min: "12000", max: "24000" }
        : { min: "800", max: "1500" };

  const checklist = [
    { label: "Job title", done: !!title.trim() },
    { label: "Description", done: !!description.trim() },
    { label: "Role type", done: !!category },
    { label: "Location", done: !!location.trim() },
  ];
  const checklistDone = checklist.filter((item) => item.done).length;

  const complianceIssues = useMemo(
    () =>
      checkPostingCompliance({
        title,
        description,
        requirements,
        benefits,
        extra: screeningQuestions.map((q) => q.prompt),
      }),
    [title, description, requirements, benefits, screeningQuestions]
  );

  const roleTypeOptions = ROLE_TYPES.map((rt) => ({ value: rt.label, label: rt.label }));
  const industryOptions = INDUSTRIES.map((ind) => ({ value: ind.label, label: ind.label }));

  return (
    <div className={isPro ? "pb-10 sm:pb-12" : undefined}>
      {error &&
        (isPro ? (
          <AttentionBanner tone="critical" title={error} className="mb-6" />
        ) : (
          <div className="mb-4 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        ))}

      <JobSoftCapBanner />

      {!hideAiTools && (
        <EasyAiJobCopyPanel
          title={title}
          category={category}
          industry={industry}
          employmentType={employmentType}
          remoteType={remoteType}
          location={location}
          description={description}
          requirements={requirements}
          benefits={benefits}
          onApply={(result) => {
            setTitle(result.title);
            setDescription(result.description);
            setRequirements(result.requirements);
            setBenefits(result.benefits);
          }}
        />
      )}

      <JobFormTopBar
        title={title}
        category={category}
        location={location}
        remoteTypeLabel={remoteTypes.find((t) => t.value === remoteType)?.label ?? ""}
        employmentType={employmentType}
        employmentTypes={employmentTypes}
        onEmploymentTypeChange={setEmploymentType}
        targetHireCount={targetHireCount}
        onTargetHireCountChange={setTargetHireCount}
        checklist={checklist}
        checklistDone={checklistDone}
        canPublishInstantly={canPublishInstantly}
      />

      <div className={isPro ? "space-y-6" : "space-y-5"}>
          <Section
            pro={isPro}
            icon={<Briefcase />}
            tone="navy"
            title="Job information"
            description="Start with the role title and how you categorize this position."
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What role are you hiring for?"
              aria-label="Job title"
              className={
                isPro
                  ? "w-full rounded-control border border-eh-line bg-eh-surface px-3 py-2 font-heading text-[22px] font-semibold tracking-[-0.01em] text-eh-ink outline-none transition-colors duration-150 placeholder:font-normal placeholder:text-eh-muted hover:border-[color-mix(in_srgb,var(--eh-ink)_22%,var(--eh-line))] focus-visible:border-eh-teal"
                  : "w-full border-none bg-transparent py-1 font-display text-2xl font-bold tracking-tight text-ink outline-none placeholder:text-ink/30"
              }
            />
            {!isPro && <div className="mt-3 h-px bg-ink/10" />}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className={isPro ? PRO_LABEL : "mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/40"} aria-hidden="true">
                  Role type
                </p>
                {isPro ? (
                  <Select
                    label="Role type"
                    value={category}
                    onChange={setCategory}
                    options={roleTypeOptions}
                    placeholder="Select a role type"
                    className="h-10 w-full"
                  />
                ) : (
                  <EmployerFormSelect
                    value={category}
                    onChange={setCategory}
                    options={roleTypeOptions}
                    placeholder="Select a role type"
                    ariaLabel="Role type"
                  />
                )}
                <p className={isPro ? "mt-1.5 text-small text-eh-muted" : "mt-1 text-[11px] text-ink/40"}>
                  The specific VA function you&apos;re hiring for.
                </p>
              </div>
              <div>
                <p className={isPro ? PRO_LABEL : "mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/40"} aria-hidden="true">
                  Industry
                </p>
                {isPro ? (
                  <Select
                    label="Industry"
                    value={industry}
                    onChange={setIndustry}
                    options={[{ value: "", label: "Not specified" }, ...industryOptions]}
                    className="h-10 w-full"
                  />
                ) : (
                  <EmployerFormSelect
                    value={industry}
                    onChange={setIndustry}
                    options={industryOptions}
                    placeholder="Select an industry (optional)"
                    ariaLabel="Industry"
                  />
                )}
                <p className={isPro ? "mt-1.5 text-small text-eh-muted" : "mt-1 text-[11px] text-ink/40"}>
                  The business domain this role supports. Optional.
                </p>
              </div>
            </div>
          </Section>

          <Section
            pro={isPro}
            icon={<FileText />}
            tone="navy"
            title="Description"
            description="Describe responsibilities, day-to-day work, and what success looks like in this role."
          >
            <RichTextEditor
              value={description}
              onChange={setDescription}
              minHeight="220px"
              accent={isPro ? "ink" : "teal"}
              placeholder="Describe the role responsibilities, team context, and day-to-day work..."
            />
          </Section>

          <Section
            pro={isPro}
            icon={<ListChecks />}
            tone="teal"
            title="Requirements"
            description="List required skills, tools, experience level, and language expectations."
          >
            <RichTextEditor
              value={requirements}
              onChange={setRequirements}
              minHeight="160px"
              accent={isPro ? "ink" : "teal"}
              placeholder="e.g. 2+ years VA experience, fluent English, HubSpot..."
            />
          </Section>

          <Section
            pro={isPro}
            icon={<Gift />}
            tone="marigold"
            title="Benefits"
            description="Highlight perks candidates care about — training, equipment, flexible hours, or growth opportunities."
          >
            <RichTextEditor
              value={benefits}
              onChange={setBenefits}
              minHeight="160px"
              accent={isPro ? "ink" : "teal"}
              placeholder="e.g. Paid training, equipment provided, flexible schedule..."
            />
          </Section>

          <Section
            pro={isPro}
            icon={<Banknote />}
            tone="marigold"
            title="Compensation"
            description="Set an expected salary range in US dollars (USD) and how it's paid out."
          >
            <div className="mb-3">
              <p className={isPro ? PRO_LABEL : "mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40"}>Pay period</p>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={isPro ? PRO_LABEL : "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/45"}>
                  Minimum (USD{periodSuffix(salaryPeriod)})
                </label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder={salaryPlaceholders.min}
                  className={isPro ? `${PRO_INPUT} font-data` : `w-full rounded-xl border border-ink/10 px-3 py-2.5 font-data text-sm text-ink outline-none ${fieldFocus}`}
                />
              </div>
              <div>
                <label className={isPro ? PRO_LABEL : "mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink/45"}>
                  Maximum (USD{periodSuffix(salaryPeriod)})
                </label>
                <input
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder={salaryPlaceholders.max}
                  className={isPro ? `${PRO_INPUT} font-data` : `w-full rounded-xl border border-ink/10 px-3 py-2.5 font-data text-sm text-ink outline-none ${fieldFocus}`}
                />
              </div>
            </div>
          </Section>

          <Section
            pro={isPro}
            icon={<MapPin />}
            tone="navy"
            title="Location"
            description="Where will this virtual assistant be working from?"
          >
            <div className="space-y-3">
              <div className="relative">
                <MapPin className={`absolute left-3 h-4 w-4 ${isPro ? "top-3 text-eh-muted" : "top-3 text-ink/35"}`} aria-hidden="true" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Philippines (Remote)"
                  aria-label="Location"
                  className={isPro ? `${PRO_INPUT} pl-9` : `w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none ${fieldFocus}`}
                />
              </div>
              <div>
                <p className={isPro ? PRO_LABEL : "mb-2 text-xs font-semibold uppercase tracking-wider text-ink/40"}>Work setup</p>
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
          </Section>

          <Section
            pro={isPro}
            icon={<MessageSquareText />}
            tone="teal"
            title="Screening questions"
            description="Optional short-text questions applicants answer when they apply. Answers are for your review only — nothing auto-rejects."
            last
          >
            <div className="space-y-3">
              {!hideAiTools && (
                <EasyAiScreeningPanel
                  title={title}
                  description={description}
                  requirements={requirements}
                  onApply={(questions) =>
                    setScreeningQuestions((prev) =>
                      [...prev, ...questions].slice(0, MAX_SCREENING_QUESTIONS)
                    )
                  }
                />
              )}
              {screeningQuestions.map((question, index) => (
                <div
                  key={index}
                  className={isPro ? "rounded-control border border-eh-line bg-eh-surface-2 p-3.5" : "rounded-xl bg-ink/[0.02] p-3"}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label
                      htmlFor={`screening-q-${index}`}
                      className={isPro ? "text-small font-medium text-eh-ink-2" : "text-xs font-bold uppercase tracking-wider text-ink/45"}
                    >
                      Question {index + 1}
                    </label>
                    {isPro ? (
                      <IconButton
                        aria-label={`Remove question ${index + 1}`}
                        title="Remove question"
                        icon={<Trash2 />}
                        onClick={() => removeScreeningQuestion(index)}
                        className="hover:text-eh-danger!"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeScreeningQuestion(index)}
                        className="cursor-pointer rounded-lg p-1.5 text-ink/35 transition hover:bg-ember/5 hover:text-ember"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    id={`screening-q-${index}`}
                    value={question.prompt}
                    onChange={(e) => updateScreeningQuestion(index, { prompt: e.target.value })}
                    rows={2}
                    maxLength={300}
                    placeholder="e.g. What timezone do you work in?"
                    className={
                      isPro
                        ? "w-full rounded-control border border-eh-line bg-eh-surface px-3 py-2 text-ui text-eh-ink outline-none transition-colors duration-150 placeholder:text-eh-muted focus-visible:border-eh-teal"
                        : `w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none ${fieldFocus}`
                    }
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <label className={`flex cursor-pointer items-center gap-2 ${isPro ? "text-small text-eh-ink-2" : "text-xs text-ink/60"}`}>
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateScreeningQuestion(index, { required: e.target.checked })
                        }
                        className={isPro ? "h-4 w-4 rounded accent-[var(--eh-teal)]" : "rounded border-ink/20 text-teal focus:ring-teal"}
                      />
                      Required
                    </label>
                    <span className={isPro ? "num text-small text-eh-muted" : "font-data text-[10px] text-ink/35"}>
                      {question.prompt.length}/300
                    </span>
                  </div>
                </div>
              ))}

              {screeningQuestions.length < MAX_SCREENING_QUESTIONS ? (
                <button
                  type="button"
                  onClick={addScreeningQuestion}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed px-3 transition ${
                    isPro
                      ? "h-10 rounded-control border-eh-line text-ui font-medium text-eh-ink-2 hover:border-eh-muted hover:bg-eh-surface-2 hover:text-eh-ink"
                      : "rounded-xl border-ink/15 py-2.5 text-xs font-semibold text-ink/60 hover:border-teal/40 hover:bg-teal/5 hover:text-teal"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add question ({screeningQuestions.length}/{MAX_SCREENING_QUESTIONS})
                </button>
              ) : (
                <p className={isPro ? "text-center text-small text-eh-muted" : "text-center text-[11px] text-ink/40"}>
                  Maximum of {MAX_SCREENING_QUESTIONS} questions reached.
                </p>
              )}
            </div>
          </Section>
      </div>

      <div className="mt-6">
        <PostingComplianceNotice issues={complianceIssues} autoPublish={canPublishInstantly} />
      </div>

      <EmployerActionBar>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {isPro ? (
              canPublishInstantly ? (
                <StatusBadge tone="success" className="max-w-full">
                  <span className="inline-flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                    {editingLiveJob ? "Changes go live right away" : "Publishes instantly — no admin queue"}
                  </span>
                </StatusBadge>
              ) : (
                <span className="flex items-center gap-1.5 text-small text-eh-muted">
                  <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Reviewed before going live until your company is verified
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-ink/40">
                <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Jobs are reviewed before going live
              </span>
            )}
          {isPro ? (
            editingLiveJob ? (
              <div className="flex flex-wrap gap-2">
                <Button size="lg" variant="ghost" onClick={() => window.history.back()}>
                  Cancel
                </Button>
                <Button size="lg" variant="primary" loading={loading} onClick={() => handleAction("draft")}>
                  {loading ? "Saving…" : "Save changes"}
                </Button>
              </div>
            ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="lg" variant="ghost" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button size="lg" disabled={loading} onClick={() => handleAction("draft")}>
                {loading ? "Saving…" : "Save draft"}
              </Button>
              <Button size="lg" variant="primary" loading={loading} onClick={() => handleAction("submit")}>
                {loading
                  ? canPublishInstantly
                    ? "Publishing…"
                    : "Submitting…"
                  : canPublishInstantly
                    ? "Publish job"
                    : "Submit for review"}
              </Button>
            </div>
            )
          ) : editingLiveJob ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="cursor-pointer rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction("draft")}
                className="cursor-pointer rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-all hover:bg-teal/95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save changes"}
              </button>
            </div>
          ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="cursor-pointer rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("draft")}
              className="cursor-pointer rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save draft"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction("submit")}
              className="cursor-pointer rounded-xl bg-teal px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal/15 transition-all hover:bg-teal/95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit for review"}
            </button>
          </div>
          )}
        </div>
      </EmployerActionBar>
    </div>
  );
}
