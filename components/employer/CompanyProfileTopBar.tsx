"use client";

import Link from "next/link";
import { ExternalLink, Briefcase, Users, Check } from "lucide-react";

type ChecklistItem = { label: string; done: boolean };

type Props = {
  logoInitials: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  companyName: string;
  industry: string;
  description: string;
  highlights: string[];
  headquarters: string;
  teamSize: string;
  website: string;
  activeJobsCount: number;
  totalApplicantsCount: number;
  verified: boolean;
  companyId?: string;
  profileStrength: number;
  strengthLabel: string;
  checklist: ChecklistItem[];
};

export default function CompanyProfileTopBar({
  logoInitials,
  logoUrl,
  bannerUrl,
  companyName,
  industry,
  description,
  highlights,
  headquarters,
  teamSize,
  website,
  activeJobsCount,
  totalApplicantsCount,
  verified,
  companyId,
  profileStrength,
  strengthLabel,
  checklist,
}: Props) {
  const checklistDone = checklist.filter((i) => i.done).length;
  const progress = checklist.length > 0 ? (checklistDone / checklist.length) * 100 : 0;
  const displayDescription =
    description ||
    "Add your company description to help candidates understand your culture and mission.";

  const pulseStats = [
    { label: "Active jobs", value: activeJobsCount.toString(), icon: Briefcase },
    { label: "Applicants", value: totalApplicantsCount.toString(), icon: Users },
    ...(teamSize ? [{ label: "Team size", value: teamSize, icon: Users }] : []),
  ];

  return (
    <div className="mb-5 rounded-2xl border border-navy/[0.08] bg-white/90 p-4 shadow-[0_8px_24px_-6px_rgba(30,58,95,0.08)] sm:p-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.75fr)] xl:gap-5">
        <div className="overflow-hidden rounded-xl border border-ink/8 bg-white ring-1 ring-navy/[0.04]">
          <p className="border-b border-ink/[0.06] bg-gradient-to-r from-navy/[0.03] to-teal/[0.02] px-3 py-2 text-xs font-bold uppercase tracking-wider text-navy/50">
            Seeker preview
          </p>
          <div className="h-20 overflow-hidden sm:h-24">
            {bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full bg-gradient-to-r from-teal/50 via-navy/40 to-teal/30" />
            )}
          </div>
          <div className="relative px-4 pb-4 pt-0">
            <div className="-mt-7 mb-2 flex items-end gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-xl border-[3px] border-white bg-teal object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border-[3px] border-white bg-teal font-display text-lg font-bold text-white shadow-sm">
                  {logoInitials}
                </div>
              )}
              <div className="min-w-0 flex-1 pb-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate font-display text-sm font-bold text-ink">
                    {companyName || "Your Company"}
                  </p>
                  {verified && (
                    <span className="rounded-full bg-teal/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-teal">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink/50">{industry || "Industry not set"}</p>
              </div>
            </div>
            <p className="line-clamp-2 text-[11px] leading-relaxed text-ink/65">{displayDescription}</p>
            {highlights.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {highlights.slice(0, 3).map((h) => (
                  <span
                    key={h}
                    className="rounded-md bg-teal/8 px-1.5 py-0.5 text-[9px] font-semibold text-teal"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
                Profile strength
              </p>
              <p className="font-display text-2xl font-bold text-ink">{profileStrength}%</p>
            </div>
            <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-teal">
              {strengthLabel}
            </span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5 text-[11px]">
                {item.done ? (
                  <Check className="h-3 w-3 shrink-0 text-teal" strokeWidth={3} aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink/15" aria-hidden="true" />
                )}
                <span className={item.done ? "text-ink/55" : "text-ink/75"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Company pulse</p>
          <dl className="space-y-2.5">
            {pulseStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-xs text-ink/50">
                    <Icon className="h-3.5 w-3.5 text-ink/35" aria-hidden="true" />
                    {stat.label}
                  </dt>
                  <dd className="font-data text-sm font-semibold text-ink">{stat.value}</dd>
                </div>
              );
            })}
          </dl>
          {(headquarters || website) && (
            <div className="border-t border-ink/[0.06] pt-2 text-[11px] text-ink/45">
              {headquarters && <p>{headquarters}</p>}
              {website && (
                <p className="truncate">{website.replace(/^https?:\/\/(www\.)?/, "")}</p>
              )}
            </div>
          )}
          {companyId && (
            <Link
              href={`/companies/${companyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-navy/10 bg-white px-3 py-2 text-xs font-semibold text-ink/60 transition hover:border-teal/25 hover:text-teal"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View public page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
