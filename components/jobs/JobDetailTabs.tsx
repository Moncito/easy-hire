"use client";

import { useState } from "react";
import {
  MapPin,
  Wallet,
  Clock,
  Zap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { formatEnumLabel, formatPesoRange, type SalaryPeriod } from "@/lib/format";
import { relativeTime, isClosingSoon, closingLabel } from "@/lib/time-ago";
import Badge from "@/components/ui/Badge";
import MarkdownContent from "@/components/ui/MarkdownContent";
import type { JobDetailData } from "@/components/jobs/JobDetailContent";

type Tab = "overview" | "requirements" | "benefits";

type Props = {
  job: JobDetailData;
  applyAction?: React.ReactNode;
  /** Hide in-content apply block (full job page uses sidebar CTA). */
  hideApplySection?: boolean;
  variant?: "panel" | "page";
};

type GlanceMetric = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent: "marigold" | "navy" | "teal" | "amber";
};

const accentStyles = {
  marigold: {
    well: "bg-marigold/12 text-marigold",
    value: "text-ink",
  },
  navy: {
    well: "bg-navy/8 text-navy",
    value: "text-ink",
  },
  teal: {
    well: "bg-teal/10 text-teal",
    value: "text-ink",
  },
  amber: {
    well: "bg-marigold/15 text-[#8a5a10]",
    value: "text-ink",
  },
} as const;

function GlanceMetricCell({ metric }: { metric: GlanceMetric }) {
  const Icon = metric.icon;
  const styles = accentStyles[metric.accent];

  return (
    <div className="flex min-w-0 flex-1 gap-3 px-4 py-4 first:pl-0 last:pr-0 sm:px-5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.well}`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink/40">{metric.label}</p>
        <p
          className={`mt-0.5 text-sm font-semibold leading-snug ${metric.label === "Base pay" ? "font-data" : ""} ${styles.value}`}
        >
          {metric.value}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-ink/45">{metric.hint}</p>
      </div>
    </div>
  );
}

function buildGlanceMetrics(job: JobDetailData): GlanceMetric[] {
  let hiringValue = "Actively hiring";
  let hiringHint = "Employer is reviewing applications";
  let hiringAccent: GlanceMetric["accent"] = "teal";

  if (job.expiresAt && isClosingSoon(job.expiresAt)) {
    hiringValue = closingLabel(job.expiresAt);
    hiringHint = "Spots may fill quickly";
    hiringAccent = "amber";
  } else if (job.publishedAt) {
    const rel = relativeTime(job.publishedAt);
    hiringValue = rel === "just now" ? "Just posted" : `${rel} ago`;
    hiringHint = "Fresh listing — early applicants stand out";
    hiringAccent = "marigold";
  }

  return [
    {
      icon: Wallet,
      label: "Base pay",
      value: formatPesoRange(job.salaryMin, job.salaryMax, job.salaryPeriod as SalaryPeriod),
      hint: "Guaranteed USD range · no hidden cuts",
      accent: "marigold",
    },
    {
      icon: Clock,
      label: "Schedule",
      value: formatEnumLabel(job.employmentType),
      hint: "Know your hours before you apply",
      accent: "navy",
    },
    {
      icon: MapPin,
      label: "Location",
      value: `${formatEnumLabel(job.remoteType)} · ${job.location}`,
      hint: "Work setup confirmed by employer",
      accent: "teal",
    },
    {
      icon: Zap,
      label: "Hiring speed",
      value: hiringValue,
      hint: hiringHint,
      accent: hiringAccent,
    },
  ];
}

export default function JobDetailTabs({
  job,
  applyAction,
  hideApplySection = false,
  variant = "panel",
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const glanceMetrics = buildGlanceMetrics(job);

  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "requirements", label: "Requirements", disabled: !job.requirements },
    { id: "benefits", label: "Benefits", disabled: !job.benefits },
  ];

  return (
    <div>
      <header className="mb-5">
        <div className="flex items-start gap-3.5">
          {job.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.company.logoUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-ink/8"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marigold/12 font-display text-base font-bold text-marigold ring-1 ring-marigold/15">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="marigold">{job.category}</Badge>
              <Badge tone="ink">{formatEnumLabel(job.employmentType)}</Badge>
              <Badge tone="teal">{formatEnumLabel(job.remoteType)}</Badge>
            </div>
            <h1
              className={`mt-2 font-display font-bold leading-snug text-ink ${
                variant === "page" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
              }`}
            >
              {job.title}
            </h1>
            <p className="text-sm font-medium text-ink/55">{job.company.companyName}</p>
          </div>
        </div>
      </header>

      {variant === "page" && applyAction ? (
        <div className="mb-6">{applyAction}</div>
      ) : null}

      {/* Editorial tab row — text + marigold rule, no pill chrome */}
      <nav className="mb-6 border-b border-ink/[0.08]" aria-label="Job details">
        <div className="flex gap-8 overflow-x-auto sm:gap-10" role="tablist">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={t.disabled}
                onClick={() => setTab(t.id)}
                className={`group relative shrink-0 cursor-pointer pb-3.5 pt-0.5 transition disabled:cursor-not-allowed disabled:opacity-35 ${
                  active ? "text-ink" : "text-ink/38 hover:text-ink/65"
                }`}
              >
                <span
                  className={`block text-[13px] tracking-tight ${
                    active ? "font-display font-bold" : "font-medium"
                  }`}
                >
                  {t.label}
                </span>
                <span
                  className={`mt-2 block h-[2px] w-full origin-left transition-transform duration-200 ${
                    active ? "scale-x-100 bg-marigold" : "scale-x-0 bg-marigold/50 group-hover:scale-x-100"
                  }`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      </nav>

      {tab === "overview" && (
        <div className="space-y-6">
          {/* At-a-glance — scannable trust strip */}
          <section aria-label="Role at a glance">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/35">
              At a glance
            </p>
            <div className="grid grid-cols-1 divide-y divide-ink/[0.06] border-y border-ink/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {glanceMetrics.map((metric) => (
                <GlanceMetricCell key={metric.label} metric={metric} />
              ))}
            </div>
          </section>

          {!hideApplySection && applyAction && (
            <section className="border-l-[3px] border-marigold/50 py-1 pl-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {job.company.verifiedStatus === "APPROVED" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Verified employer
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink/55">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  Direct to employer
                </span>
              </div>
              {applyAction}
            </section>
          )}

          {hideApplySection && (
            <div className="flex flex-wrap gap-2 border-b border-ink/[0.06] pb-5">
              {job.company.verifiedStatus === "APPROVED" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Verified employer
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink/55">
                <Users className="h-3 w-3" aria-hidden="true" />
                Direct to employer
              </span>
            </div>
          )}

          <section>
            <h2 className="font-display text-sm font-bold text-ink">About the role</h2>
            <p className="mt-1 text-xs text-ink/45">Everything you need to decide if this is your next move.</p>
            <div className="mt-4">
              <MarkdownContent content={job.description} />
            </div>
          </section>
        </div>
      )}

      {tab === "requirements" && job.requirements && (
        <section>
          <h2 className="font-display text-sm font-bold text-ink">Requirements</h2>
          <p className="mt-1 text-xs text-ink/45">See if your skills align before you invest time applying.</p>
          <div className="mt-4">
            <MarkdownContent content={job.requirements} />
          </div>
        </section>
      )}

      {tab === "benefits" && job.benefits && (
        <section>
          <h2 className="font-display text-sm font-bold text-ink">Benefits & perks</h2>
          <p className="mt-1 text-xs text-ink/45">What you earn beyond the base pay.</p>
          <div className="mt-4">
            <MarkdownContent content={job.benefits} />
          </div>
        </section>
      )}
    </div>
  );
}
