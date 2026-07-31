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
import { timeAgo, isClosingSoon, closingLabel } from "@/lib/time-ago";
import Badge from "@/components/ui/Badge";
import MarkdownContent from "@/components/ui/MarkdownContent";
import type { JobDetailData } from "@/components/jobs/JobDetailContent";

type Tab = "overview" | "requirements" | "benefits";

type Props = {
  job: JobDetailData;
  applyAction: React.ReactNode;
};

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-navy/8 bg-white/90 p-3 shadow-sm">
      <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-navy/5 text-navy/70">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{label}</p>
      <p className="mt-0.5 font-data text-xs font-semibold leading-snug text-ink">{value}</p>
    </div>
  );
}

export default function JobDetailTabs({ job, applyAction }: Props) {
  const [tab, setTab] = useState<Tab>("overview");

  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hiringSpeed = isClosingSoon(job.expiresAt)
    ? closingLabel(job.expiresAt!)
    : job.publishedAt
      ? `Posted ${timeAgo(job.publishedAt)}`
      : "Actively hiring";

  const tabs: { id: Tab; label: string; disabled?: boolean }[] = [
    { id: "overview", label: "Overview" },
    { id: "requirements", label: "Requirements", disabled: !job.requirements },
    { id: "benefits", label: "Benefits", disabled: !job.benefits },
  ];

  return (
    <div>
      <header className="mb-4">
        <div className="flex items-start gap-3">
          {job.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company.logoUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-white object-cover shadow-md" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-marigold/15 font-display text-base font-bold text-marigold shadow-md">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="marigold">{job.category}</Badge>
              <Badge tone="ink">{formatEnumLabel(job.employmentType)}</Badge>
              <Badge tone="teal">{formatEnumLabel(job.remoteType)}</Badge>
            </div>
            <h1 className="mt-2 font-display text-lg font-bold leading-snug text-ink sm:text-xl">{job.title}</h1>
            <p className="text-sm font-medium text-ink/55">{job.company.companyName}</p>
          </div>
        </div>
      </header>

      <div className="mb-4 flex gap-1 rounded-xl border border-navy/8 bg-mist/40 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={t.disabled}
            onClick={() => setTab(t.id)}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-white text-ink shadow-sm"
                : "text-ink/45 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile
              icon={Wallet}
              label="Base pay"
              value={formatPesoRange(job.salaryMin, job.salaryMax, job.salaryPeriod as SalaryPeriod)}
            />
            <StatTile icon={Clock} label="Schedule" value={formatEnumLabel(job.employmentType)} />
            <StatTile
              icon={MapPin}
              label="Location"
              value={`${formatEnumLabel(job.remoteType)} · ${job.location}`}
            />
            <StatTile icon={Zap} label="Hiring speed" value={hiringSpeed} />
          </div>

          <div className="rounded-2xl border border-marigold/25 bg-gradient-to-br from-marigold/12 via-white to-teal/5 p-5 shadow-[0_8px_30px_rgba(242,169,59,0.12)]">
            <div className="mb-3 flex flex-wrap gap-2">
              {job.company.verifiedStatus === "APPROVED" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                  Verified employer
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy/70">
                <Users className="h-3 w-3" aria-hidden="true" />
                Direct to employer
              </span>
            </div>
            {applyAction}
          </div>

          <section>
            <h2 className="font-display text-sm font-bold text-ink">About the role</h2>
            <div className="mt-3">
              <MarkdownContent content={job.description} />
            </div>
          </section>
        </div>
      )}

      {tab === "requirements" && job.requirements && (
        <section>
          <h2 className="font-display text-sm font-bold text-ink">Requirements</h2>
          <div className="mt-3">
            <MarkdownContent content={job.requirements} />
          </div>
        </section>
      )}

      {tab === "benefits" && job.benefits && (
        <section>
          <h2 className="font-display text-sm font-bold text-ink">Benefits & perks</h2>
          <div className="mt-3">
            <MarkdownContent content={job.benefits} />
          </div>
        </section>
      )}
    </div>
  );
}
