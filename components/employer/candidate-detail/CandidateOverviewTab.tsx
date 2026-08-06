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
import { skillName } from "@/lib/seeker-profile-format";
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
        <p className="text-[10px] text-ink/40">{label}</p>
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
  const { seeker } = application;
  const salary = formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax);
  const primarySkill = seeker.skills[0] ? skillName(seeker.skills[0]) : "—";
  const education = seeker.education[0]?.trim() || "—";
  const languages = seeker.languages.length > 0 ? seeker.languages.join(", ") : "—";

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-ink/5">
        <h3 className="font-display text-sm font-semibold text-ink">Snapshot</h3>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <SnapshotCell icon={MapPin} label="Location" value={seeker.location || "—"} />
          <SnapshotCell
            icon={Banknote}
            label="Expected salary"
            value={salary === "Not specified" ? "—" : salary}
          />
          <SnapshotCell icon={Briefcase} label="Availability" value={seeker.availability || "—"} />
          <SnapshotCell icon={Calendar} label="Experience" value={seeker.yearsExperience || "—"} />
          <SnapshotCell icon={Star} label="Primary skill" value={primarySkill} />
          <SnapshotCell icon={Languages} label="Languages" value={languages} />
          <SnapshotCell icon={GraduationCap} label="Education" value={education} />
          <SnapshotCell icon={Clock} label="Notice period" value="—" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-ink/5 pt-3">
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
      </div>

      {seeker.skills.length > 0 && (
        <div className="mt-3 border-t border-ink/5 pt-3">
          <p className="text-xs font-medium text-ink/45">Skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {seeker.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium text-ink/70 ring-1 ring-ink/6"
              >
                {skillName(skill)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
