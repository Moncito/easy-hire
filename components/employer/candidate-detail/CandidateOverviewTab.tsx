"use client";

import {
  MapPin,
  Banknote,
  Briefcase,
  Calendar,
  GraduationCap,
  Languages,
  Clock,
  Star,
} from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import { skillName } from "@/lib/seeker/profile-format";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import CandidateEasyAiPanel from "./CandidateEasyAiPanel";
import type { CandidateApplication } from "./types";

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
        <p className="text-xs text-ink/40">{label}</p>
        <p className="truncate text-xs font-semibold text-ink" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

type Props = {
  application: CandidateApplication;
  onRating: (rating: number) => void;
};

export default function CandidateOverviewTab({ application, onRating }: Props) {
  const { isPro } = useEmployerShell();
  const { seeker } = application;
  const skills = seeker.skills ?? [];
  const educationEntries = seeker.education ?? [];
  const languages = seeker.languages ?? [];
  const salary = formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax);
  const primarySkill = skills[0] ? skillName(skills[0]) : "—";
  const education = educationEntries[0]?.trim() || "—";
  const languagesLabel = languages.length > 0 ? languages.join(", ") : "—";

  const snapshot = (
    <>
      <h3 className="font-display text-sm font-semibold text-ink">Snapshot</h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <SnapshotCell icon={MapPin} label="Location" value={seeker.location || "—"} />
        <SnapshotCell
          icon={Banknote}
          label="Expected salary"
          value={salary === "Not specified" ? "—" : salary}
        />
        <SnapshotCell icon={Briefcase} label="Availability" value={seeker.availability || "—"} />
        <SnapshotCell icon={Calendar} label="Experience" value={seeker.yearsExperience || "—"} />
        <SnapshotCell icon={Star} label="Primary skill" value={primarySkill} />
        <SnapshotCell icon={Languages} label="Languages" value={languagesLabel} />
        <SnapshotCell icon={GraduationCap} label="Education" value={education} />
        <SnapshotCell icon={Clock} label="Notice period" value="—" />
      </dl>
      {skills.length > 0 && (
        <div className={isPro ? "mt-4" : "mt-3 border-t border-ink/5 pt-3"}>
          <p className="text-xs font-medium text-ink/45">Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className={
                  isPro
                    ? "rounded-full bg-marigold/12 px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-marigold/20"
                    : "rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink/70 ring-1 ring-ink/6"
                }
              >
                {skillName(skill)}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className={isPro ? "mt-4 flex items-center justify-between" : "mt-3 flex items-center justify-between border-t border-ink/5 pt-3"}>
        <span className="text-xs text-ink/45">Your rating</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onRating(v)}
              className="rounded p-0.5 transition hover:scale-110"
              aria-label={`Rate ${v} stars`}
            >
              <Star
                className={`h-4 w-4 ${
                  (application.rating ?? 0) >= v ? "fill-marigold text-marigold" : "text-ink/15"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      {isPro ? (
        <section>{snapshot}</section>
      ) : (
        <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-ink/5">{snapshot}</div>
      )}

      <CandidateEasyAiPanel
        key={application.id}
        applicationId={application.id}
        status={application.status}
      />
    </div>
  );
}
