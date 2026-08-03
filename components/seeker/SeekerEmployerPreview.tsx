"use client";

import { useState } from "react";
import { formatPesoRange } from "@/lib/format";
import {
  displayCertification,
  displayEducation,
  displayLanguage,
  displaySkill,
  displayWorkExperience,
  isDiscoverableInTalentSearch,
  timezoneLabel,
} from "@/lib/seeker-profile-format";
import { ExternalLink, FileText, Globe, Link2, MapPin, Users } from "lucide-react";
import { profileBucketCompletion } from "@/components/seeker/profile-buckets";
import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";

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
  languages: string[];
  workExperience: string[];
  education: string[];
  timezone: string | null;
  photoUrl: string | null;
  visibility: ProfileVisibilityLevel;
};

type PreviewMode = "talent" | "applicant";

export default function SeekerEmployerPreview({ data, profileId }: { data: EmployerPreviewData; profileId?: string }) {
  const [mode, setMode] = useState<PreviewMode>("talent");
  const { completed, total } = profileBucketCompletion({
    ...data,
    resumeUrl: data.resumeUrl,
    photoUrl: data.photoUrl,
  });

  const initials =
    data.fullName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VA";

  const discoverable = isDiscoverableInTalentSearch(data.visibility);

  return (
    <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-[0_8px_30px_rgba(30,58,95,0.04)] lg:sticky lg:top-28">
      {/* ── Header: LIVE PREVIEW badge + compact mode toggle ── */}
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
          Live preview
        </span>
        <div className="flex items-center gap-1 rounded-lg bg-ink/[0.04] p-0.5">
          <button
            type="button"
            onClick={() => setMode("talent")}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
              mode === "talent" ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/60"
            }`}
          >
            <Users className="h-3 w-3" aria-hidden="true" />
            Talent
          </button>
          <button
            type="button"
            onClick={() => setMode("applicant")}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
              mode === "applicant" ? "bg-white text-ink shadow-sm" : "text-ink/40 hover:text-ink/60"
            }`}
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
            Applicant
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-marigold/8 px-3 py-2.5">
        <div
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#F2A93B ${(completed / total) * 360}deg, rgba(32,36,43,0.08) 0deg)`,
          }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-data text-[10px] font-bold text-ink">
            {completed}/{total}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink">Profile strength</p>
          <p className="text-[10px] text-ink/45">{completed} of {total} sections complete</p>
        </div>
      </div>

      {mode === "talent" && !discoverable && (
        <p className="mb-3 rounded-lg bg-ember/8 px-3 py-2 text-xs text-ember">
          Hidden from talent search — choose Standard or Public visibility to appear here.
        </p>
      )}

      {mode === "talent" && discoverable && data.visibility === "PUBLIC" && (
        <p className="mb-3 rounded-lg border border-teal/20 bg-teal/5 px-3 py-2 text-[11px] text-teal">
          Public profile — maximum visibility in talent search.
        </p>
      )}

      {mode === "applicant" && (
        <p className="mb-3 rounded-lg border border-navy/10 bg-navy/4 px-3 py-2 text-[11px] text-ink/55">
          Employers always see your full applicant profile when you apply, including resume.
        </p>
      )}

      <div className="flex items-start gap-3">
        {data.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.photoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
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
              className="rounded-md bg-ink/8 px-2 py-0.5 text-[10px] font-semibold text-ink/55"
            >
              {displaySkill(skill)}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-1.5 text-xs text-ink/55">
        {data.availability && <p>Availability: {data.availability}</p>}
        {data.yearsExperience && <p>Experience: {data.yearsExperience}</p>}
        {data.timezone && (
          <p className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" />
            {timezoneLabel(data.timezone)}
          </p>
        )}
        {(data.desiredSalaryMin || data.desiredSalaryMax) && (
          <p className="font-data text-sm font-semibold text-marigold">
            {formatPesoRange(data.desiredSalaryMin, data.desiredSalaryMax)}
          </p>
        )}
      </div>

      {data.languages.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Languages</p>
          <ul className="mt-1.5 space-y-1">
            {data.languages.map((lang) => (
              <li key={lang} className="text-xs text-ink/65">
                {displayLanguage(lang)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.workExperience.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Experience</p>
          <ul className="mt-1.5 space-y-2">
            {data.workExperience.slice(0, mode === "talent" ? 2 : 4).map((entry) => (
              <li key={entry} className="text-xs text-ink/65">
                {displayWorkExperience(entry)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.education.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Education</p>
          <ul className="mt-1.5 space-y-1">
            {data.education.slice(0, mode === "talent" ? 1 : 3).map((entry) => (
              <li key={entry} className="text-xs text-ink/65">
                {displayEducation(entry)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.bio && (
        <p className="mt-4 line-clamp-4 text-xs leading-relaxed text-ink/60">{data.bio}</p>
      )}

      {data.certifications.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/50">Certifications</p>
          <ul className="mt-1.5 space-y-1">
            {data.certifications.map((c) => (
              <li key={c} className="text-xs text-ink/65">
                {displayCertification(c)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(mode === "applicant" || data.resumeUrl) && data.resumeUrl && (
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

      {/* ── View full profile button ── */}
      {profileId && (
        <a
          href={`/seekers/${profileId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-ink/15 px-4 py-2.5 text-xs font-semibold text-ink/60 transition-colors hover:border-navy/30 hover:text-navy"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          View full profile
        </a>
      )}
    </div>
  );
}
