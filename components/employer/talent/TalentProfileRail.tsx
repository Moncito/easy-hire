import Link from "next/link";
import {
  MapPin,
  Banknote,
  Briefcase,
  Calendar,
  Languages,
  Globe,
  FileText,
  Link2,
  ExternalLink,
} from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import {
  displayLanguage,
  displaySkill,
  isDiscoverableInTalentSearch,
  timezoneLabel,
} from "@/lib/seeker/profile-format";
import { profileBucketCompletion } from "@/components/seeker/profile-buckets";
import type { EmployerPreviewData } from "@/components/seeker/SeekerEmployerPreview";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";

function SnapshotCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/35" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[10px] text-ink/40">{label}</p>
        <p className="truncate text-xs font-semibold text-ink" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

type Props = {
  data: EmployerPreviewData;
  seekerId: string;
  canDownloadResume: boolean;
};

export default function TalentProfileRail({ data, seekerId, canDownloadResume }: Props) {
  const skills = data.skills ?? [];
  const languages = data.languages ?? [];
  const { completed, total } = profileBucketCompletion(data);
  const discoverable = isDiscoverableInTalentSearch(data.visibility);
  const salary = formatPesoRange(data.desiredSalaryMin, data.desiredSalaryMax);
  const primarySkill = skills[0] ? displaySkill(skills[0]) : "—";

  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24">
      <DashboardSurface className="overflow-hidden !p-0">
        <div className="border-b border-navy/[0.06] bg-gradient-to-r from-navy/[0.04] to-teal/[0.03] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60">
            At a glance
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <SnapshotCell icon={MapPin} label="Location" value={data.location || "—"} />
          <SnapshotCell
            icon={Banknote}
            label="Expected salary"
            value={salary === "Not specified" ? "—" : salary}
          />
          <SnapshotCell icon={Briefcase} label="Availability" value={data.availability || "—"} />
          <SnapshotCell icon={Calendar} label="Experience" value={data.yearsExperience || "—"} />
          <SnapshotCell icon={Briefcase} label="Primary skill" value={primarySkill} />
          <SnapshotCell
            icon={Languages}
            label="Languages"
            value={languages.length > 0 ? languages.map(displayLanguage).join(", ") : "—"}
          />
          {data.timezone && (
            <SnapshotCell
              icon={Globe}
              label="Timezone"
              value={timezoneLabel(data.timezone)}
            />
          )}
        </div>
      </DashboardSurface>

      <DashboardSurface>
        <div className="flex items-center gap-3">
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
            <p className="text-xs font-bold text-ink">Profile strength</p>
            <p className="text-[10px] text-ink/45">
              {completed} of {total} sections complete
            </p>
          </div>
        </div>
        {!discoverable && (
          <p className="mt-3 rounded-lg bg-ember/8 px-3 py-2 text-[11px] leading-relaxed text-ember">
            Hidden from talent search — visible here because they applied or you have access.
          </p>
        )}
      </DashboardSurface>

      {skills.length > 0 && (
        <DashboardSurface>
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60">Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md bg-teal/8 px-2 py-0.5 text-[10px] font-semibold text-teal"
              >
                {displaySkill(skill)}
              </span>
            ))}
          </div>
        </DashboardSurface>
      )}

      {(canDownloadResume || data.linkedinUrl || data.portfolioUrl) && (
        <DashboardSurface>
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60">Links</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {canDownloadResume && data.resumeUrl && (
              <a
                href={`/api/employer/talent/${seekerId}/resume`}
                className="inline-flex items-center gap-1 rounded-lg bg-teal/10 px-2.5 py-1.5 text-[11px] font-semibold text-teal hover:bg-teal/15"
              >
                <FileText className="h-3 w-3" />
                Resume
              </a>
            )}
            {data.linkedinUrl && (
              <a
                href={data.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-navy/5 px-2.5 py-1.5 text-[11px] font-semibold text-navy hover:bg-navy/10"
              >
                <Link2 className="h-3 w-3" />
                LinkedIn
              </a>
            )}
            {data.portfolioUrl && (
              <a
                href={data.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-navy/5 px-2.5 py-1.5 text-[11px] font-semibold text-navy hover:bg-navy/10"
              >
                <ExternalLink className="h-3 w-3" />
                Portfolio
              </a>
            )}
          </div>
        </DashboardSurface>
      )}

      <Link
        href={`/seekers/${seekerId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 rounded-2xl border border-navy/10 bg-white/90 px-4 py-2.5 text-xs font-semibold text-ink/60 shadow-sm transition hover:border-teal/25 hover:text-teal"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        View public profile
      </Link>
    </div>
  );
}
