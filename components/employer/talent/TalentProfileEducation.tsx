import { GraduationCap, Award } from "lucide-react";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import {
  displayCertification,
  displayEducation,
  parseEducation,
} from "@/lib/seeker-profile-format";

type Props = {
  education: string[];
  certifications: string[];
};

export default function TalentProfileEducation({ education, certifications }: Props) {
  if (education.length === 0 && certifications.length === 0) return null;

  return (
    <DashboardSurface>
      {education.length > 0 && (
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/60">
            <GraduationCap className="h-3 w-3" aria-hidden="true" />
            Education
          </p>
          <ul className="mt-4 space-y-3">
            {education.map((entry) => {
              const { school, degree, field, year } = parseEducation(entry);
              const degreeLine = [degree, field].filter(Boolean).join(", ");

              return (
                <li key={entry} className="border-l-2 border-navy/15 pl-4">
                  {degreeLine && (
                    <p className="font-display text-sm font-bold text-ink">{degreeLine}</p>
                  )}
                  {school && <p className="mt-0.5 text-sm text-ink/60">{school}</p>}
                  {year && (
                    <p className="mt-1 font-data text-xs tabular-nums text-ink/45">{year}</p>
                  )}
                  {!degreeLine && !school && (
                    <p className="text-sm text-ink/65">{displayEducation(entry)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {certifications.length > 0 && (
        <div className={education.length > 0 ? "mt-5 border-t border-ink/[0.06] pt-5" : ""}>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/60">
            <Award className="h-3 w-3" aria-hidden="true" />
            Certifications
          </p>
          <ul className="mt-3 space-y-2">
            {certifications.map((cert) => (
              <li key={cert} className="text-sm text-ink/65">
                {displayCertification(cert)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardSurface>
  );
}
