import { Briefcase } from "lucide-react";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import { displayWorkExperience, parseWorkExperience } from "@/lib/seeker-profile-format";

type Props = {
  workExperience: string[];
};

export default function TalentProfileExperience({ workExperience }: Props) {
  if (workExperience.length === 0) return null;

  return (
    <DashboardSurface>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-navy/60">
        <Briefcase className="h-3 w-3" aria-hidden="true" />
        Experience
      </p>
      <ul className="mt-4 space-y-4">
        {workExperience.map((entry) => {
          const { title, company, startDate, endDate, description } = parseWorkExperience(entry);
          const dates = [startDate, endDate].filter(Boolean).join(" – ");

          return (
            <li
              key={entry}
              className="relative border-l-2 border-teal/25 pl-4 last:pb-0"
            >
              <p className="font-display text-sm font-bold text-ink">
                {title || displayWorkExperience(entry)}
              </p>
              {company && <p className="mt-0.5 text-sm text-ink/60">{company}</p>}
              {dates && (
                <p className="mt-1 font-data text-xs tabular-nums text-ink/45">{dates}</p>
              )}
              {description && (
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{description}</p>
              )}
            </li>
          );
        })}
      </ul>
    </DashboardSurface>
  );
}
