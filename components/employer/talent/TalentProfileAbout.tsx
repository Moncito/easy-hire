import { Languages } from "lucide-react";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import { displayLanguage } from "@/lib/seeker-profile-format";

type Props = {
  bio: string | null;
  languages: string[];
};

export default function TalentProfileAbout({ bio, languages }: Props) {
  if (!bio && languages.length === 0) return null;

  return (
    <DashboardSurface>
      <p className="text-xs font-bold uppercase tracking-wider text-navy/60">About</p>
      {bio ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{bio}</p>
      ) : (
        <p className="mt-3 text-sm italic text-ink/45">No bio provided yet.</p>
      )}

      {languages.length > 0 && (
        <div className="mt-4 border-t border-ink/[0.06] pt-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-navy/60">
            <Languages className="h-3 w-3" aria-hidden="true" />
            Languages
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {languages.map((language) => (
              <span
                key={language}
                className="rounded-md bg-navy/5 px-2.5 py-1 text-xs font-medium text-ink/70"
              >
                {displayLanguage(language)}
              </span>
            ))}
          </div>
        </div>
      )}
    </DashboardSurface>
  );
}
