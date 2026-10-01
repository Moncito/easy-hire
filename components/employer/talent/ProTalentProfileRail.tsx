import { EyeOff, FileText, Link2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/employer/system";
import ProfileSectionLabel from "@/components/employer/talent/ProfileSectionLabel";
import type { EmployerPreviewData } from "@/components/seeker/SeekerEmployerPreview";
import { displaySkill, isDiscoverableInTalentSearch } from "@/lib/seeker/profile-format";

const CARD = "rounded-card border border-eh-line bg-eh-surface p-5 shadow-eh-sm";

/**
 * Employer Pro talent profile side rail: skills (the first is their
 * primary skill), links, a note when the profile is hidden from search,
 * and the public profile. The at-a-glance facts live in the hero's stat
 * strip, so they aren't repeated here.
 */
export default function ProTalentProfileRail({
  data,
  seekerId,
  canDownloadResume,
}: {
  data: EmployerPreviewData;
  seekerId: string;
  canDownloadResume: boolean;
}) {
  const skills = data.skills ?? [];
  const discoverable = isDiscoverableInTalentSearch(data.visibility);
  const hasLinks = (canDownloadResume && data.resumeUrl) || data.linkedinUrl || data.portfolioUrl;

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      {!discoverable && (
        <p className="flex gap-2.5 rounded-card border border-eh-line bg-eh-surface-2 px-4 py-3 text-small text-eh-ink-2">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-eh-muted" aria-hidden="true" />
          Hidden from talent search — you can see it because they applied or you have access.
        </p>
      )}

      {skills.length > 0 && (
        <section className={CARD}>
          <ProfileSectionLabel icon={<Sparkles aria-hidden="true" />} tone="teal">
            Skills
          </ProfileSectionLabel>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {skills.map((skill, index) => (
              <li
                key={skill}
                className={
                  index === 0
                    ? "rounded-full bg-eh-teal px-2.5 py-1 text-small font-medium text-white"
                    : "rounded-full bg-eh-teal-tint px-2.5 py-1 text-small font-medium text-eh-teal-ink"
                }
                title={index === 0 ? "Primary skill" : undefined}
              >
                {displaySkill(skill)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-micro text-eh-muted">First skill is their primary one.</p>
        </section>
      )}

      {hasLinks && (
        <section className={CARD}>
          <ProfileSectionLabel icon={<Link2 aria-hidden="true" />} tone="navy">
            Links
          </ProfileSectionLabel>
          <div className="mt-4 flex flex-col gap-2">
            {canDownloadResume && data.resumeUrl && (
              <Button href={`/api/employer/talent/${seekerId}/resume`} native icon={<FileText />} className="justify-start">
                Resume
              </Button>
            )}
            {data.linkedinUrl && (
              <Button href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" icon={<Link2 />} className="justify-start">
                LinkedIn
              </Button>
            )}
            {data.portfolioUrl && (
              <Button href={data.portfolioUrl} target="_blank" rel="noopener noreferrer" icon={<ExternalLink />} className="justify-start">
                Portfolio
              </Button>
            )}
          </div>
        </section>
      )}

      {/* /seekers/[id] only serves PUBLIC profiles (it 404s for every other
          visibility, deliberately), so the link only exists when it works. */}
      {data.visibility === "PUBLIC" && (
        <Button href={`/seekers/${seekerId}`} target="_blank" rel="noopener noreferrer" variant="ghost" icon={<ExternalLink />}>
          View public profile
        </Button>
      )}
    </div>
  );
}
