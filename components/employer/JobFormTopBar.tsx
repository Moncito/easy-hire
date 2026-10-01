"use client";

import Link from "next/link";
import { Check, Eye, Users } from "lucide-react";
import InstantPublishNote from "@/components/employer/ui/InstantPublishNote";
import { Card, cx } from "@/components/employer/system";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";

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
  /** Verified Employer Pro: submitting publishes live. */
  canPublishInstantly?: boolean;
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
  canPublishInstantly = false,
}: Props) {
  const { isPro } = useEmployerShell();
  const employmentLabel =
    employmentTypes.find((t) => t.value === employmentType)?.label ?? "Full-Time";
  const previewMeta =
    [category, remoteTypeLabel, location].filter(Boolean).join(" · ") ||
    "Add role type and location";
  const progress = checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0;

  if (isPro) {
    const complete = checklistDone === checklist.length;
    return (
      <Card as="section" aria-label="Listing overview" padded={false} className="mb-6 overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-eh-line lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:divide-x lg:divide-y-0">
          <div className="p-5">
            <p className="flex items-center gap-1.5 text-small font-medium text-eh-muted">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Live preview
            </p>
            <p className="mt-2 font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
              {title.trim() || "Untitled role"}
            </p>
            <p className="mt-1 text-small text-eh-muted">{previewMeta}</p>
            <span className="mt-2 inline-flex rounded-full bg-eh-teal-tint px-2.5 py-0.5 text-small font-medium text-eh-teal-ink">
              {employmentLabel}
            </span>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="mb-2 text-small font-medium text-eh-ink-2">Employment type</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Employment type">
                {employmentTypes.map((type) => {
                  const selected = employmentType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onEmploymentTypeChange(type.value)}
                      className={cx(
                        "inline-flex h-8 items-center rounded-full border px-3 text-ui transition-colors duration-150",
                        selected
                          ? "border-eh-ink bg-eh-ink font-medium text-eh-surface"
                          : "border-eh-line bg-eh-surface text-eh-ink-2 hover:border-eh-muted hover:text-eh-ink"
                      )}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label htmlFor="target-hire-count" className="mb-1.5 flex items-center gap-1.5 text-small font-medium text-eh-ink-2">
                <Users className="h-4 w-4 text-eh-muted" aria-hidden="true" />
                Target hires
              </label>
              <input
                id="target-hire-count"
                type="number"
                min={1}
                max={99}
                value={targetHireCount}
                onChange={(e) => onTargetHireCountChange(e.target.value)}
                className="num h-10 w-28 rounded-control border border-eh-line bg-eh-surface px-3 text-ui text-eh-ink outline-none transition-colors duration-150 focus-visible:border-eh-teal"
              />
            </div>
          </div>

          <div className="p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-small font-medium text-eh-ink-2">Ready to publish</p>
              <span className={cx("num text-small font-semibold", complete ? "text-eh-teal-ink" : "text-eh-marigold-ink")}>
                {checklistDone} / {checklist.length}
              </span>
            </div>
            <div
              className="mb-3 h-2 overflow-hidden rounded-full bg-eh-line"
              role="progressbar"
              aria-valuenow={checklistDone}
              aria-valuemin={0}
              aria-valuemax={checklist.length}
              aria-label="Required fields filled"
            >
              <div
                className={cx("h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300", complete ? "bg-eh-teal" : "bg-eh-marigold")}
                style={{ width: `${progress}%` }}
              />
            </div>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {checklist.map((item) => (
                <li key={item.label} className={cx("flex items-center gap-1.5 text-small", item.done ? "text-eh-ink-2" : "text-eh-muted")}>
                  {item.done ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-eh-teal" strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <span className="mx-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-eh-marigold" aria-hidden="true" />
                  )}
                  {item.label}
                  <span className="sr-only">{item.done ? " (done)" : " (still needed)"}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="border-t border-eh-line bg-eh-surface-2 px-5 py-3 text-small text-eh-muted">
          {canPublishInstantly ? (
            <>
              <b className="font-semibold text-eh-ink-2">Verified Employer Pro:</b> jobs go live as soon as you publish — no
              admin queue.
            </>
          ) : (
            <>
              <b className="font-semibold text-eh-ink-2">Employer Pro:</b> once your company is verified, jobs publish instantly.{" "}
              <Link href="/employer/company-profile#verification" className="font-medium text-eh-marigold-ink hover:underline">
                Finish verification
              </Link>
            </>
          )}
        </p>
      </Card>
    );
  }

  return (
    <div className={`mb-5 ${isPro ? "border-b border-ink/8 pb-5" : "rounded-2xl border border-navy/[0.08] bg-white/90 p-4 shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)] sm:p-5"}`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-5">
        <div className={isPro ? "rounded-2xl bg-mist/80 p-3.5 ring-1 ring-ink/[0.06]" : "rounded-xl bg-gradient-to-br from-navy/[0.05] to-teal/[0.04] p-3.5 ring-1 ring-navy/[0.06]"}>
          <p className={`text-xs font-bold uppercase tracking-wider ${isPro ? "text-ink/40" : "text-navy/60"}`}>Live preview</p>
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
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
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
              className={`w-full max-w-[8rem] rounded-xl border border-ink/10 px-3 py-2 font-data text-sm text-ink outline-none ${
                isPro ? "focus:border-ink/25" : "focus:border-teal focus:ring-2 focus:ring-teal/15"
              }`}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Checklist</p>
            <span className={`font-data text-[10px] font-bold ${isPro ? "text-ink/55" : "text-teal"}`}>
              {checklistDone}/{checklist.length}
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isPro ? "bg-ink" : "bg-teal"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-[11px] text-ink/60">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    item.done ? (isPro ? "bg-ink" : "bg-teal") : "bg-ink/15"
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
