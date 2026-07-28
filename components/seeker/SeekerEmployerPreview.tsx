"use client";

import { formatPesoRange } from "@/lib/format";
import { ExternalLink, FileText, Link2, MapPin } from "lucide-react";

export type EmployerPreviewData = {
  fullName: string;
  headline: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  certifications: string[];
  photoUrl: string | null;
  profileVisibility: boolean;
};

export default function SeekerEmployerPreview({ data }: { data: EmployerPreviewData }) {
  const initials = data.fullName
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "VA";

  return (
    <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-[0_8px_30px_rgba(30,58,95,0.04)] lg:sticky lg:top-28">
      <div className="mb-4 border-b border-ink/5 pb-3">
        <h3 className="text-sm font-bold tracking-tight text-ink">Employer view</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-ink/45">
          How you appear in talent search and applicant drawers.
        </p>
      </div>

      {!data.profileVisibility && (
        <p className="mb-3 rounded-lg bg-ember/8 px-3 py-2 text-xs text-ember">
          Profile hidden from talent search — employers still see you when you apply.
        </p>
      )}

      <div className="flex items-start gap-3">
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.photoUrl}
            alt=""
            className="h-14 w-14 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-marigold/15 font-display text-lg font-bold text-marigold">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink">
            {data.fullName || "Your name"}
          </p>
          <p className="mt-0.5 text-xs text-ink/55">{data.headline || "Add a headline"}</p>
          {data.location && (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink/45">
              <MapPin className="h-3 w-3" />
              {data.location}
            </p>
          )}
        </div>
      </div>

      {data.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {data.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-marigold/10 px-2 py-0.5 text-[10px] font-semibold text-[#8a5a10]"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-1.5 text-xs text-ink/55">
        {data.availability && <p>Availability: {data.availability}</p>}
        {data.yearsExperience && <p>Experience: {data.yearsExperience}</p>}
        {(data.desiredSalaryMin || data.desiredSalaryMax) && (
          <p className="font-data text-ink/70">
            {formatPesoRange(data.desiredSalaryMin, data.desiredSalaryMax)}
          </p>
        )}
      </div>

      {data.bio && (
        <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-ink/60">{data.bio}</p>
      )}

      {data.certifications.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Certifications</p>
          <ul className="mt-1.5 space-y-1">
            {data.certifications.map((c) => (
              <li key={c} className="text-xs text-ink/65">
                {c.includes("|") ? c.replace("|", " · ") : c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {data.resumeUrl && (
          <a
            href={data.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 hover:border-marigold/30"
          >
            <FileText className="h-3 w-3 text-marigold" />
            Resume
          </a>
        )}
        {data.linkedinUrl && (
          <a
            href={data.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 hover:border-teal/30"
          >
            <Link2 className="h-3 w-3 text-teal" />
            LinkedIn
          </a>
        )}
        {data.portfolioUrl && (
          <a
            href={data.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-[11px] font-semibold text-ink/70 hover:border-navy/30"
          >
            <ExternalLink className="h-3 w-3 text-navy" />
            Portfolio
          </a>
        )}
      </div>
    </div>
  );
}
