"use client";

import { Briefcase, Globe, MapPin } from "lucide-react";

type Props = {
  logoInitials: string;
  logoUrl: string | null;
  bannerUrl?: string | null;
  companyName: string;
  industry: string;
  description: string;
  highlights: string[];
  headquarters: string;
  teamSize: string;
  website: string;
  activeJobsCount: number;
  verified: boolean;
};

export default function PublicCompanyPreview({
  logoInitials,
  logoUrl,
  bannerUrl = null,
  companyName,
  industry,
  description,
  highlights,
  headquarters,
  teamSize,
  website,
  activeJobsCount,
  verified,
}: Props) {
  const displayDescription =
    description ||
    "Add your company description to help candidates understand your culture and mission.";

  return (
    <div
      className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs transition-shadow duration-300 hover:shadow-sm"
      aria-labelledby="public-preview-heading"
    >
      <div className="mb-4 border-b border-ink/5 pb-3">
        <h3 id="public-preview-heading" className="text-sm font-bold tracking-tight text-ink">
          Public Seeker Preview
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
          This is what job seekers will see on your public company page.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-xs transition-transform duration-300 hover:scale-[1.01]">
        <div className="h-16 overflow-hidden">
          {bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full bg-gradient-to-r from-teal/50 via-navy/40 to-teal/30" />
          )}
        </div>

        <div className="relative px-4 pb-4">
          <div className="-mt-8 mb-3 flex items-end gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 rounded-xl border-4 border-white bg-teal object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border-4 border-white bg-teal font-display text-lg font-bold text-white shadow-sm">
                {logoInitials}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate font-display text-base font-bold text-ink">
                  {companyName || "Your Company"}
                </h4>
                {verified && (
                  <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal">
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-ink/50">
                {industry || "Industry not set"}
              </p>
            </div>
          </div>

          <p className="line-clamp-3 text-[11px] leading-relaxed text-ink/70">{displayDescription}</p>

          {highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {highlights.slice(0, 4).map((highlight) => (
                <span
                  key={highlight}
                  className="rounded-md bg-teal/8 px-2 py-0.5 text-[10px] font-semibold text-teal"
                >
                  {highlight}
                </span>
              ))}
              {highlights.length > 4 && (
                <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/50">
                  +{highlights.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="mt-4 space-y-1.5 border-t border-ink/5 pt-3 text-[10px] text-ink/55">
            {headquarters && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-ink/35" aria-hidden="true" />
                <span>{headquarters}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-1.5">
                <Globe className="h-3 w-3 shrink-0 text-ink/35" aria-hidden="true" />
                <span className="truncate">{website.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </div>
            )}
            {teamSize && <p>{teamSize} employees</p>}
          </div>

          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-mist px-3 py-2 text-[10px] font-semibold text-ink/65">
            <Briefcase className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
            <span>
              {activeJobsCount} open {activeJobsCount === 1 ? "job" : "jobs"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
