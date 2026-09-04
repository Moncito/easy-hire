import Link from "next/link";
import { Download, MapPin } from "lucide-react";
import { formatPesoRange } from "@/lib/format";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";
import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import VerificationBadge from "@/components/seeker/VerificationBadge";
import type { VerificationTier } from "@/lib/seeker/verification-score";

export type ProTalentCardSeeker = {
  id: string;
  fullName: string;
  photoUrl: string | null;
  headline: string | null;
  location: string | null;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  saved: boolean;
  verificationScore: number;
  verificationTier: VerificationTier;
  idVerifiedAt: string | null;
};

type Props = {
  seeker: ProTalentCardSeeker;
  onToggleSaved: (seekerId: string, nextSaved: boolean) => void;
};

export default function ProTalentCard({ seeker, onToggleSaved }: Props) {
  const meta = [seeker.availability, seeker.yearsExperience].filter(Boolean);

  return (
    <article className="pro-card flex h-full flex-col p-5">
      <div className="flex gap-4">
        <Link href={`/employer/talent/${seeker.id}`} className="shrink-0">
          <EmployerAvatar
            name={seeker.fullName}
            imageUrl={seeker.photoUrl}
            size="lg"
            className="!h-14 !w-14"
            fallbackClassName="bg-ink/8 text-ink"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/employer/talent/${seeker.id}`}
                  className="font-display text-base font-bold text-ink transition hover:text-[#9A5B12]"
                >
                  {seeker.fullName}
                </Link>
                <VerificationBadge
                  score={seeker.verificationScore}
                  tier={seeker.verificationTier}
                  idVerifiedAt={seeker.idVerifiedAt}
                  accent="employer"
                />
              </div>
              <p className="mt-0.5 truncate text-sm text-ink/55">
                {seeker.headline || "Virtual Assistant"}
              </p>
            </div>
            <p className="hidden shrink-0 text-right font-data text-xs font-semibold tabular-nums text-ink sm:block">
              {formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax)}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/45">
            {seeker.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {seeker.location}
              </span>
            )}
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      {seeker.skills.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {seeker.skills.slice(0, 6).map((skill) => (
            <li
              key={skill}
              className="rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-ink/65"
            >
              {skill}
            </li>
          ))}
          {seeker.skills.length > 6 && (
            <li className="px-1 py-0.5 text-[11px] font-medium text-ink/40">
              +{seeker.skills.length - 6}
            </li>
          )}
        </ul>
      )}

      <p className="mt-2 font-data text-xs tabular-nums text-ink/55 sm:hidden">
        {formatPesoRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax)}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <SaveSeekerButton seekerId={seeker.id} saved={seeker.saved} onToggle={onToggleSaved} />
        <MessageSeekerButton seekerId={seeker.id} />
        {seeker.resumeUrl && (
          <a
            href={`/api/employer/talent/${seeker.id}/resume`}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 transition hover:border-ink/20 hover:bg-ink/[0.02]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Resume
          </a>
        )}
        <Link
          href={`/employer/talent/${seeker.id}`}
          className="ml-auto text-sm font-semibold text-[#9A5B12] hover:underline"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
