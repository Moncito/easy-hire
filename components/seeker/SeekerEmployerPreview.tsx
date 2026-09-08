"use client";

import { useState } from "react";
import Image from "next/image";
import { isDiscoverableInTalentSearch, skillName } from "@/lib/seeker/profile-format";
import { ExternalLink, FileText, MapPin, Users } from "lucide-react";
import type { ProfileVisibilityLevel } from "@/lib/validations/seeker";

/**
 * Phase B2 — trimmed to a compact "what employers see" summary card.
 * /seekers/[id] (the real public profile) is one click away via the "Open
 * full public preview" link below, so this no longer needs to duplicate the
 * entire profile (bio, full skills/languages/work/education/certs lists,
 * resume/LinkedIn/portfolio buttons) — that content lived here at ~10-11px
 * type with visible text-wrapping problems in a ~280-340px sidebar. Full
 * field set is kept on `EmployerPreviewData` even though most of it isn't
 * rendered here anymore: profile-buckets.ts's completion math depends on
 * this same shape.
 */

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

const MAX_PREVIEW_SKILLS = 5;

export default function SeekerEmployerPreview({ data, profileId }: { data: EmployerPreviewData; profileId?: string }) {
  const [mode, setMode] = useState<PreviewMode>("talent");

  const initials =
    data.fullName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "VA";

  const discoverable = isDiscoverableInTalentSearch(data.visibility);
  const previewSkills = data.skills.slice(0, MAX_PREVIEW_SKILLS);
  const extraSkillCount = data.skills.length - previewSkills.length;

  return (
    <div className="rounded-[24px] bg-ink p-6 shadow-[0_20px_50px_-18px_rgba(32,36,43,0.35)] lg:sticky lg:top-28">
      {/* ── Header: LIVE PREVIEW badge + compact mode toggle ── */}
      <div className="mb-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-marigold">
          <span className="h-1.5 w-1.5 rounded-full bg-marigold" aria-hidden="true" />
          Live preview
        </span>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.06] p-0.5">
          <button
            type="button"
            onClick={() => setMode("talent")}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
              mode === "talent" ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60"
            }`}
          >
            <Users className="h-3 w-3" aria-hidden="true" />
            Talent
          </button>
          <button
            type="button"
            onClick={() => setMode("applicant")}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
              mode === "applicant" ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60"
            }`}
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
            Applicant
          </button>
        </div>
      </div>

      {mode === "talent" && !discoverable && (
        <p className="mb-4 rounded-lg border border-ember/30 bg-ember/15 px-3 py-2 text-xs text-ember">
          Hidden from talent search — choose Standard or Public visibility to appear here.
        </p>
      )}

      {mode === "talent" && discoverable && data.visibility === "PUBLIC" && (
        <p className="mb-4 rounded-lg border border-teal/30 bg-teal/12 px-3 py-2 text-[11px] leading-snug text-[#5fc4b3]">
          Public profile — maximum visibility in talent search.
        </p>
      )}

      {mode === "applicant" && (
        <p className="mb-4 rounded-lg border border-white/12 bg-white/5 px-3 py-2 text-[11px] leading-snug text-white/55">
          Employers always see your full applicant profile when you apply, including resume.
        </p>
      )}

      <div className="flex items-start gap-3.5">
        {data.photoUrl ? (
          <Image
            src={data.photoUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marigold/18 font-display text-lg font-bold text-marigold">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-white">
            {data.fullName || "Your name"}
          </p>
          <p className="mt-0.5 text-xs text-white/55">{data.headline || "Add a headline"}</p>
          {data.location && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-white/45">
              <MapPin className="h-3 w-3" />
              {data.location}
            </p>
          )}
        </div>
      </div>

      {previewSkills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {previewSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-white/8 px-2.5 py-1 text-[10px] font-semibold text-white/65"
            >
              {skillName(skill)}
            </span>
          ))}
          {extraSkillCount > 0 && (
            <span className="rounded-md px-2 py-1 text-[10px] font-semibold text-white/35">
              +{extraSkillCount} more
            </span>
          )}
        </div>
      )}

      {/* ── Primary CTA: full rendered public profile is one click away.
          Marigold is the seeker accent, so it's the one bold pop of color
          against this dark card. ── */}
      {profileId && (
        <a
          href={`/seekers/${profileId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-marigold px-4 py-3 text-xs font-bold text-ink transition-colors hover:bg-marigold/90"
        >
          Open full public preview
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
