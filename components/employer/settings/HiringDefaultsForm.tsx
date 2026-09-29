"use client";

import { useId, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import EmployerFormSelect from "@/components/employer/ui/EmployerFormSelect";
import { INDUSTRIES, ROLE_TYPES } from "@/lib/constants/job-categories";
import {
  APPLICANT_NOTE_MAX,
  REJECTION_MESSAGE_MAX,
  hiringDefaultsSchema,
  type HiringDefaults,
} from "@/lib/validations/hiring-defaults";

const MAX_QUESTIONS = 5;
const QUESTION_MAX = 300;

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
];
const REMOTE_TYPES = [
  { value: "REMOTE", label: "Remote" },
  { value: "ONSITE", label: "On-site" },
  { value: "HYBRID", label: "Hybrid" },
];
const SALARY_PERIODS = [
  { value: "HOURLY", label: "Hourly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
];

type FormState = {
  category: string;
  industry: string;
  employmentType: string;
  remoteType: string;
  salaryPeriod: string;
  location: string;
  screeningQuestions: Array<{ prompt: string; required: boolean }>;
  rejectionMessage: string;
  applicantNote: string;
};

function toFormState(defaults: HiringDefaults): FormState {
  return {
    category: defaults.category ?? "",
    industry: defaults.industry ?? "",
    employmentType: defaults.employmentType ?? "",
    remoteType: defaults.remoteType ?? "",
    salaryPeriod: defaults.salaryPeriod ?? "",
    location: defaults.location ?? "",
    screeningQuestions: defaults.screeningQuestions.map((q) => ({ prompt: q.prompt, required: q.required })),
    rejectionMessage: defaults.rejectionMessage ?? "",
    applicantNote: defaults.applicantNote ?? "",
  };
}

/** Blank selects mean "no default"; blank questions are dropped rather than rejected. */
function toPayload(state: FormState) {
  return {
    category: state.category || null,
    industry: state.industry || null,
    employmentType: state.employmentType || null,
    remoteType: state.remoteType || null,
    salaryPeriod: state.salaryPeriod || null,
    location: state.location,
    screeningQuestions: state.screeningQuestions.filter((q) => q.prompt.trim().length > 0),
    rejectionMessage: state.rejectionMessage,
    applicantNote: state.applicantNote,
  };
}

function Group({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="border-t border-ink/[0.06] px-5 py-5 first:border-t-0 sm:px-6">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/55">{description}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink/45">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15";

/**
 * Settings → Workspace → Hiring defaults. One form, one save: the four
 * defaults are small and read together, so splitting them into separate
 * saves would only add buttons.
 */
export default function HiringDefaultsForm({ initialDefaults }: { initialDefaults: HiringDefaults }) {
  const [saved, setSaved] = useState(() => toFormState(initialDefaults));
  const [form, setForm] = useState(saved);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const locationId = useId();
  const rejectionId = useId();
  const noteId = useId();
  const errorId = useId();

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus("");
  }

  function updateQuestion(index: number, patch: Partial<{ prompt: string; required: boolean }>) {
    update(
      "screeningQuestions",
      form.screeningQuestions.map((q, i) => (i === index ? { ...q, ...patch } : q))
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const payload = toPayload(form);
    const check = hiringDefaultsSchema.safeParse(payload);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    setStatus("Saving your hiring defaults…");
    try {
      const res = await fetch("/api/employer/hiring-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = (data as { error?: string } | null)?.error ?? "Couldn't save. Please try again.";
        setError(message);
        setStatus(message);
        return;
      }
      const next = toFormState(data as HiringDefaults);
      setSaved(next);
      setForm(next);
      setStatus("Hiring defaults saved.");
    } catch {
      const message = "Couldn't save. Please check your connection and try again.";
      setError(message);
      setStatus(message);
    } finally {
      setSubmitting(false);
    }
  }

  const noDefault = { value: "", label: "No default" };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5">
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
        <Group
          title="New jobs start with"
          description="Pre-filled when anyone on your team posts a job. They can change any of it before saving."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Role type</FieldLabel>
              <EmployerFormSelect
                ariaLabel="Default role type"
                value={form.category}
                onChange={(value) => update("category", value)}
                placeholder="No default"
                options={ROLE_TYPES.map((r) => ({ value: r.label, label: r.label }))}
                searchable
              />
            </div>
            <div>
              <FieldLabel>Industry</FieldLabel>
              <EmployerFormSelect
                ariaLabel="Default industry"
                value={form.industry}
                onChange={(value) => update("industry", value)}
                placeholder="No default"
                options={INDUSTRIES.map((i) => ({ value: i.label, label: i.label }))}
                searchable
              />
            </div>
            <div>
              <FieldLabel>Employment type</FieldLabel>
              <EmployerFormSelect
                ariaLabel="Default employment type"
                value={form.employmentType}
                onChange={(value) => update("employmentType", value)}
                placeholder={noDefault.label}
                options={EMPLOYMENT_TYPES}
              />
            </div>
            <div>
              <FieldLabel>Work setup</FieldLabel>
              <EmployerFormSelect
                ariaLabel="Default work setup"
                value={form.remoteType}
                onChange={(value) => update("remoteType", value)}
                placeholder={noDefault.label}
                options={REMOTE_TYPES}
              />
            </div>
            <div>
              <FieldLabel>Salary period</FieldLabel>
              <EmployerFormSelect
                ariaLabel="Default salary period"
                value={form.salaryPeriod}
                onChange={(value) => update("salaryPeriod", value)}
                placeholder={noDefault.label}
                options={SALARY_PERIODS}
              />
            </div>
            <div>
              <FieldLabel htmlFor={locationId}>Location</FieldLabel>
              <input
                id={locationId}
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
                maxLength={120}
                placeholder="e.g. Anywhere in the Philippines"
                className={inputClass}
              />
            </div>
          </div>
        </Group>

        <Group
          title="Screening questions"
          description="Copied into every new job. Editing them here never changes jobs you've already posted."
        >
          {form.screeningQuestions.length === 0 && (
            <p className="mb-3 text-sm text-ink/45">No default questions yet.</p>
          )}
          <ol className="space-y-3">
            {form.screeningQuestions.map((question, index) => (
              <li key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="hidden w-5 shrink-0 font-data text-xs text-ink/40 sm:block">{index + 1}.</span>
                <input
                  value={question.prompt}
                  onChange={(event) => updateQuestion(index, { prompt: event.target.value })}
                  maxLength={QUESTION_MAX}
                  aria-label={`Question ${index + 1}`}
                  placeholder="e.g. How many years have you worked with Shopify?"
                  className={`${inputClass} min-w-0 flex-1`}
                />
                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-1.5 text-sm text-ink/65">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(event) => updateQuestion(index, { required: event.target.checked })}
                      className="h-4 w-4 rounded border-ink/30 accent-teal"
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      update(
                        "screeningQuestions",
                        form.screeningQuestions.filter((_, i) => i !== index)
                      )
                    }
                    className="rounded-lg p-2 text-ink/35 transition hover:bg-ink/[0.05] hover:text-ink"
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {form.screeningQuestions.length < MAX_QUESTIONS && (
            <button
              type="button"
              onClick={() =>
                update("screeningQuestions", [...form.screeningQuestions, { prompt: "", required: true }])
              }
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-teal transition hover:text-teal/80"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a question
            </button>
          )}
          <p className="mt-2 text-xs text-ink/40">Up to {MAX_QUESTIONS}, same as on a job.</p>
        </Group>

        <Group
          title="Rejection message"
          description="The reject dialog opens with this. You can edit or clear it each time, and nothing is sent without you confirming."
        >
          <textarea
            id={rejectionId}
            aria-label="Default rejection message"
            value={form.rejectionMessage}
            onChange={(event) => update("rejectionMessage", event.target.value.slice(0, REJECTION_MESSAGE_MAX))}
            rows={4}
            placeholder="e.g. Thank you for applying. We've decided to move forward with candidates whose experience more closely matches this role."
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1 text-right font-data text-[10px] text-ink/40">
            {form.rejectionMessage.length}/{REJECTION_MESSAGE_MAX}
          </p>
        </Group>

        <Group
          title="Note for applicants"
          description="Added to the email applicants get when they apply, and shown on screen right after. A good place to set expectations."
        >
          <textarea
            id={noteId}
            aria-label="Note for applicants"
            value={form.applicantNote}
            onChange={(event) => update("applicantNote", event.target.value.slice(0, APPLICANT_NOTE_MAX))}
            rows={3}
            placeholder="e.g. We review every application and reply within 5 business days."
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1 text-right font-data text-[10px] text-ink/40">
            {form.applicantNote.length}/{APPLICANT_NOTE_MAX}
          </p>
        </Group>
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-ember">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || submitting}
          aria-busy={submitting}
          aria-describedby={error ? errorId : undefined}
          className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save defaults"}
        </button>
        {dirty && !submitting && (
          <button
            type="button"
            onClick={() => {
              setForm(saved);
              setError(null);
            }}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.04] hover:text-ink"
          >
            Discard changes
          </button>
        )}
        {!dirty && status === "Hiring defaults saved." && (
          <span className="text-sm text-ink/55">Saved.</span>
        )}
      </div>
    </form>
  );
}
