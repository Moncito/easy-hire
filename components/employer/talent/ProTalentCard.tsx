import Link from "next/link";
import { ArrowUpRight, Download, MapPin } from "lucide-react";
import { formatSalaryRange } from "@/lib/format";
import { displaySkill } from "@/lib/seeker/profile-format";
import { Avatar, Button, Card } from "@/components/employer/system";
import SaveSeekerButton from "@/components/employer/SaveSeekerButton";
import MessageSeekerButton from "@/components/employer/MessageSeekerButton";
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

/**
 * One VA in Talent search: who (name, verification, headline), what they
 * want (pay, availability, experience, location), what they do (skills),
 * then Message as the main action with Save, Resume and the profile link.
 */
export default function ProTalentCard({ seeker, onToggleSaved }: Props) {
  const profileHref = `/employer/talent/${seeker.id}`;
  const salary = formatSalaryRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax);
  const meta = [seeker.availability, seeker.yearsExperience].filter(Boolean) as string[];

  return (
    <Card as="article" padded={false} aria-label={seeker.fullName} className="flex h-full flex-col p-5 transition-shadow duration-150 hover:shadow-eh-md">
      <div className="flex gap-4">
        <Link href={profileHref} className="shrink-0 rounded-full" tabIndex={-1} aria-hidden="true">
          <Avatar name={seeker.fullName} src={seeker.photoUrl} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={profileHref}
                  className="text-[16px] font-semibold text-eh-ink transition-colors duration-150 hover:text-eh-marigold-ink"
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
              <p className="mt-0.5 truncate text-ui text-eh-muted">{seeker.headline || "Virtual Assistant"}</p>
            </div>
            {salary !== "Not specified" && (
              <p className="hidden shrink-0 text-right font-data text-small font-medium text-eh-ink sm:block">{salary}</p>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-eh-muted">
            {seeker.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {seeker.location}
              </span>
            )}
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
            {salary !== "Not specified" && <span className="font-data text-eh-ink-2 sm:hidden">{salary}</span>}
          </div>
        </div>
      </div>

      {seeker.skills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
          {seeker.skills.slice(0, 6).map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-eh-line bg-eh-surface-2 px-2.5 py-0.5 text-[12px] text-eh-ink-2"
            >
              {displaySkill(skill)}
            </li>
          ))}
          {seeker.skills.length > 6 && (
            <li className="px-1 py-0.5 text-[12px] text-eh-muted">+{seeker.skills.length - 6} more</li>
          )}
        </ul>
      )}

      <div className="mt-auto pt-4">
      <div className="flex flex-wrap items-center gap-2 border-t border-eh-line pt-4">
        <MessageSeekerButton seekerId={seeker.id} />
        <SaveSeekerButton seekerId={seeker.id} saved={seeker.saved} onToggle={onToggleSaved} />
        {seeker.resumeUrl && (
          <Button size="sm" variant="ghost" href={`/api/employer/talent/${seeker.id}/resume`} native icon={<Download />}>
            Resume
          </Button>
        )}
        <Link
          href={profileHref}
          className="ml-auto inline-flex items-center gap-1 rounded-chip text-ui font-medium text-eh-ink-2 transition-colors duration-150 hover:text-eh-ink"
        >
          View profile
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      </div>
    </Card>
  );
}
